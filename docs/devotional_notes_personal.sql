alter table public.devotional_notes
add column if not exists passage_reference text,
add column if not exists title text;

alter table public.devotional_notes
alter column passage_id drop not null;

alter table public.devotional_screen_content
add column if not exists reference_placeholder text,
add column if not exists title_placeholder text;

update public.devotional_screen_content
set
  title = 'Devocionales',
  subtitle = 'Guarda notas personales segun el versiculo o capitulo que estas estudiando.',
  search_placeholder = null,
  notes_title = null,
  note_placeholder = 'Escribe tu nota...',
  save_button_text = 'Guardar nota',
  empty_text = 'Aun no tienes notas devocionales guardadas.',
  reference_placeholder = 'Versiculo o capitulo, por ejemplo Juan 15 o Salmo 119:105',
  title_placeholder = 'Titulo opcional'
where is_active = true;
