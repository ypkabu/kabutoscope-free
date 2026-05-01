-- 判断メモで WATCH_ONLY も保存できるようにします。
alter table trade_journal drop constraint if exists trade_journal_account_type_check;
alter table trade_journal add constraint trade_journal_account_type_check check (account_type in ('NISA','TOKUTEI','WATCH_ONLY'));
