use anchor_lang::prelude::*;

declare_id!("9ad7ocUQqvMkee4URwVMvaLSxuEPiofb2UjR1hv4EgyN");

// ============================================================
//  КОНСТАНТЫ
// ============================================================

const VAULT_SEED: &[u8] = b"vault";
const USER_STATE_SEED: &[u8] = b"user_state";
const MAX_REASON_LEN: usize = 200;

// ============================================================
//  ПРОГРАММА
// ============================================================

#[program]
pub mod ai_trader {
    use super::*;

    /// Принимает SOL от пользователя в vault.
    /// При первом вызове инициализирует UserState аккаунт.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;

        // Переводим SOL от пользователя → в vault PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Первый депозит — инициализируем владельца и стратегию по умолчанию
        if user_state.owner == Pubkey::default() {
            user_state.owner = ctx.accounts.user.key();
            user_state.strategy = Strategy::Conservative;
        }
        user_state.balance += amount;

        emit!(DepositEvent {
            user: ctx.accounts.user.key(),
            amount,
            new_balance: user_state.balance,
        });

        msg!("Deposit: {} lamports от {}", amount, ctx.accounts.user.key());
        Ok(())
    }

    /// Устанавливает стратегию пользователя: Conservative / Aggressive.
    pub fn set_strategy(ctx: Context<SetStrategy>, strategy: Strategy) -> Result<()> {
        msg!("Strategy set: {:?}", strategy);
        ctx.accounts.user_state.strategy = strategy;
        Ok(())
    }

    /// Исполняет торговое решение AI-агента.
    /// Только agent_authority может вызвать эту функцию.
    /// action: 0 = BUY, 1 = SELL, 2 = HOLD
    pub fn execute(
        ctx: Context<Execute>,
        user: Pubkey,       // чей аккаунт торгуем
        action: u8,         // 0=BUY, 1=SELL, 2=HOLD
        amount: u64,        // размер позиции в lamports
        price: u64,         // цена SOL в USD * 100 (например 14250 = $142.50)
        reason: String,     // объяснение от LLM (до 200 символов)
    ) -> Result<()> {
        // Проверяем длину reason — String без ограничения может вызвать overflow аккаунта
        require!(
            reason.len() <= MAX_REASON_LEN,
            TradingError::ReasonTooLong
        );

        // Проверяем что вызывает именно авторизованный агент (agent_authority из конфига)
        require!(
            ctx.accounts.agent.key() == ctx.accounts.config.agent_authority,
            TradingError::UnauthorizedAgent
        );

        let user_state = &mut ctx.accounts.user_state;

        require!(user_state.owner == user, TradingError::WrongUser);
        require!(amount <= user_state.balance, TradingError::InsufficientBalance);

        match action {
            0 => {
                // BUY — симулируем покупку: списываем USDC-эквивалент, записываем позицию
                user_state.balance = user_state
                    .balance
                    .checked_sub(amount)
                    .ok_or(TradingError::InsufficientBalance)?;
                user_state.position += amount;
                user_state.last_action = Action::Buy;

                emit!(TradeEvent {
                    user,
                    action: Action::Buy,
                    amount,
                    price,
                    reason: reason.clone(),
                    timestamp: Clock::get()?.unix_timestamp,
                });
                msg!("BUY executed: {} lamports @ price {}", amount, price);
            }
            1 => {
                // SELL — симулируем продажу: возвращаем баланс, закрываем позицию
                let sell_amount = user_state.position.min(amount);
                user_state.position = user_state
                    .position
                    .checked_sub(sell_amount)
                    .unwrap_or(0);
                user_state.balance += sell_amount;
                user_state.last_action = Action::Sell;

                emit!(TradeEvent {
                    user,
                    action: Action::Sell,
                    amount: sell_amount,
                    price,
                    reason: reason.clone(),
                    timestamp: Clock::get()?.unix_timestamp,
                });
                msg!("SELL executed: {} lamports @ price {}", sell_amount, price);
            }
            2 => {
                // HOLD — ничего не меняем, просто логируем решение on-chain
                user_state.last_action = Action::Hold;
                emit!(TradeEvent {
                    user,
                    action: Action::Hold,
                    amount: 0,
                    price,
                    reason: reason.clone(),
                    timestamp: Clock::get()?.unix_timestamp,
                });
                msg!("HOLD: агент решил ждать");
            }
            _ => return Err(TradingError::InvalidAction.into()),
        }

        Ok(())
    }

    /// Возвращает SOL пользователю из vault.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;

        require!(
            amount <= user_state.balance,
            TradingError::InsufficientBalance
        );

        // Переводим SOL из vault → пользователю через PDA подпись
        let bump = ctx.bumps.vault;
        let seeds = &[VAULT_SEED, &[bump]];
        let signer_seeds = &[&seeds[..]];

        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.vault.key(),
            &ctx.accounts.user.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_ix,
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        user_state.balance -= amount;

        emit!(WithdrawEvent {
            user: ctx.accounts.user.key(),
            amount,
            remaining_balance: user_state.balance,
        });

        msg!("Withdraw: {} lamports → {}", amount, ctx.accounts.user.key());
        Ok(())
    }

    /// Вызывается один раз при деплое.
    /// Создаёт конфиг программы с публичным ключом агента.
    pub fn initialize(ctx: Context<Initialize>, agent_authority: Pubkey) -> Result<()> {
        ctx.accounts.config.agent_authority = agent_authority;
        ctx.accounts.config.admin = ctx.accounts.admin.key();
        msg!("Config initialized. Agent authority: {}", agent_authority);
        Ok(())
    }

    /// Создаёт vault PDA — вызвать один раз сразу после initialize.
    /// Vault хранит SOL всех пользователей и принадлежит программе.
    pub fn init_vault(_ctx: Context<InitVault>) -> Result<()> {
        msg!("Vault PDA created");
        Ok(())
    }
}

// ============================================================
//  АККАУНТЫ ДЛЯ КАЖДОЙ ИНСТРУКЦИИ
// ============================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Fix #1: отдельная инструкция для создания vault PDA
#[derive(Accounts)]
pub struct InitVault<'info> {
    #[account(
        init,
        payer = admin,
        space = 8,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    // Vault уже существует (создан через init_vault), просто принимаем SOL
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserState::INIT_SPACE,
        seeds = [USER_STATE_SEED, user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetStrategy<'info> {
    #[account(
        mut,
        seeds = [USER_STATE_SEED, user.key().as_ref()],
        bump,
        constraint = user_state.owner == user.key() @ TradingError::WrongUser
    )]
    pub user_state: Account<'info, UserState>,

    #[account(mut)]
    pub user: Signer<'info>,
}

impl UserState {
    pub fn owner(&self) -> Pubkey {
        self.owner
    }
}

#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct Execute<'info> {
    #[account(
        mut,
        seeds = [USER_STATE_SEED, user.as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, ProgramConfig>,

    pub agent: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, Vault>,

    // Fix #3: has_one = owner гарантирует что user_state принадлежит именно подписанту
    #[account(
        mut,
        seeds = [USER_STATE_SEED, user.key().as_ref()],
        bump,
        constraint = user_state.owner == user.key() @ TradingError::WrongUser
    )]
    pub user_state: Account<'info, UserState>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ============================================================
//  СТРУКТУРЫ ДАННЫХ (хранятся on-chain)
// ============================================================

/// Глобальный конфиг программы — один аккаунт на всю программу
#[account]
#[derive(InitSpace)]
pub struct ProgramConfig {
    pub admin: Pubkey,
    pub agent_authority: Pubkey, // публичный ключ авторизованного агента
}

/// Персональное состояние каждого пользователя
#[account]
#[derive(InitSpace)]
pub struct UserState {
    pub owner: Pubkey,       // кошелёк пользователя
    pub balance: u64,        // свободный баланс в lamports
    pub position: u64,       // открытая позиция (симуляция)
    pub strategy: Strategy,  // Conservative / Aggressive
    pub last_action: Action, // последнее действие агента
}

/// PDA-хранилище SOL. Данных нет, только lamports + discriminator.
#[account]
pub struct Vault {}

// ============================================================
//  ENUMS
// ============================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, InitSpace)]
pub enum Strategy {
    Conservative,
    Aggressive,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub enum Action {
    Buy,
    Sell,
    Hold,
}

// ============================================================
//  СОБЫТИЯ (emit! — логируются on-chain, фронтенд слушает через addEventListener)
// ============================================================

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

#[event]
pub struct TradeEvent {
    pub user: Pubkey,
    pub action: Action,
    pub amount: u64,
    pub price: u64,     // USD * 100
    pub reason: String, // объяснение от LLM
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub remaining_balance: u64,
}

// ============================================================
//  ОШИБКИ
// ============================================================

#[error_code]
pub enum TradingError {
    #[msg("Только авторизованный агент может исполнять сделки")]
    UnauthorizedAgent,

    #[msg("Недостаточно средств на балансе")]
    InsufficientBalance,

    #[msg("Неверное действие: 0=BUY, 1=SELL, 2=HOLD")]
    InvalidAction,

    #[msg("UserState принадлежит другому пользователю")]
    WrongUser,

    #[msg("Строка reason превышает максимальную длину 200 символов")]
    ReasonTooLong,
}
