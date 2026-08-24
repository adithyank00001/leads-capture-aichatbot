-- Launcher hint bubble: customizable text + background color
alter table public.bot_widget_settings
  add column if not exists launcher_hint_text text not null default 'May I help you?',
  add column if not exists launcher_hint_color text not null default '#E2E8EF';

alter table public.bot_widget_settings
  drop constraint if exists bot_widget_settings_launcher_hint_text_length;

alter table public.bot_widget_settings
  add constraint bot_widget_settings_launcher_hint_text_length
  check (char_length(trim(launcher_hint_text)) >= 1 and char_length(launcher_hint_text) <= 80);

alter table public.bot_widget_settings
  drop constraint if exists bot_widget_settings_launcher_hint_color_hex;

alter table public.bot_widget_settings
  add constraint bot_widget_settings_launcher_hint_color_hex
  check (launcher_hint_color ~* '^#([0-9A-F]{3}|[0-9A-F]{6})$');
