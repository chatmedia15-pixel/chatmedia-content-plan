-- ============================================================
-- 002 SEED BRANDS (4 brand bawaan)
-- ============================================================

insert into brands (slug, name, category, color, pillars, ideas)
values
  (
    'chatbarber',
    'ChatBarber',
    'Barber & Grooming',
    '#2F5CFF',
    '["Transformation","Edukasi","Behind the Scene","Lifestyle","Entertainment"]'::jsonb,
    '["Before & After haircut","Transformasi gaya rambut","Tips memilih haircut","Kesalahan memilih gaya rambut","Barber POV","Behind the scene","Reaksi pelanggan","Tren haircut","Barber tools","Haircut + shoe treatment lifestyle"]'::jsonb
  ),
  (
    'shoetreatment',
    'Chat Shoe Treatment',
    'Shoe Care',
    '#0EA5A4',
    '["Transformation","Edukasi","Testimonial","Product/Service","Storytelling"]'::jsonb,
    '["Before & After","Sepatu hampir dibuang","Kesalahan mencuci sepatu","Tips merawat sneakers","Sepatu putih menguning","Deep Cleaning","Fast Cleaning","Proses treatment","Reaksi pelanggan","Tips menjaga sepatu"]'::jsonb
  ),
  (
    'chatbox',
    'Chatbox',
    'Cafe & Lifestyle',
    '#D97706',
    '["Lifestyle","Community","Behind the Scene","Product/Service","Storytelling"]'::jsonb,
    '["Suasana cafe","Morning coffee","Menu favorit","Behind the scene barista","Cerita menu","Lifestyle","Nongkrong","Customer experience","Rekomendasi menu","Community moment"]'::jsonb
  ),
  (
    'konveksi',
    'Konveksi',
    'Custom Apparel',
    '#7C3AED',
    '["Behind the Scene","Product/Service","Edukasi","Storytelling","Promotion"]'::jsonb,
    '["Proses produksi","Desain menjadi produk","Behind the scene","Pemilihan bahan","Detail jahitan","Custom apparel","Packaging","Hasil produksi","Kesalahan memilih bahan","Produk dari nol sampai jadi"]'::jsonb
  )
on conflict (slug) do nothing;