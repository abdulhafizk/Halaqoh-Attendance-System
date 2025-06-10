-- Remove all demo data first
DELETE FROM memorization WHERE santri_id IN (SELECT id FROM santri WHERE name LIKE '%Demo%' OR name LIKE '%Santri%');
DELETE FROM attendance WHERE ustadz_id IN (SELECT id FROM ustadz WHERE name LIKE '%Demo%' OR name LIKE 'Ustadz %');
DELETE FROM santri WHERE name LIKE '%Demo%' OR name LIKE '%Santri%';
DELETE FROM ustadz WHERE name LIKE '%Demo%' OR name LIKE 'Ustadz %';
DELETE FROM profiles WHERE id LIKE 'demo-%';

-- Insert real Ustadz data
INSERT INTO ustadz (name, halaqoh, phone, address) VALUES 
  ('Ust. Muhammad Ridwan, S.Pd.I', 'Halaqoh Al-Fatihah', '081234567890', 'Jl. Masjid Agung No. 15, Yogyakarta'),
  ('Ust. Ahmad Fauzi, Lc', 'Halaqoh Al-Baqarah', '081345678901', 'Jl. Pondok Pesantren No. 8, Yogyakarta'),
  ('Ust. Abdullah Hakim, M.Ag', 'Halaqoh Ali Imran', '081456789012', 'Jl. Islamic Center No. 22, Yogyakarta'),
  ('Ust. Yusuf Mansur, S.Th.I', 'Halaqoh An-Nisa', '081567890123', 'Jl. Dakwah No. 5, Yogyakarta'),
  ('Ust. Ibrahim Khalil, Lc', 'Halaqoh Al-Maidah', '081678901234', 'Jl. Tahfidz No. 12, Yogyakarta'),
  ('Ust. Umar Faruq, M.Pd.I', 'Halaqoh Al-Anam', '081789012345', 'Jl. Quran No. 18, Yogyakarta'),
  ('Ust. Ali Hasan, S.Ag', 'Halaqoh Al-Araf', '081890123456', 'Jl. Sunnah No. 7, Yogyakarta'),
  ('Ust. Hasan Basri, Lc', 'Halaqoh Al-Anfal', '081901234567', 'Jl. Hidayah No. 25, Yogyakarta')
ON CONFLICT DO NOTHING;

-- Insert real Santri data
INSERT INTO santri (name, halaqoh, age, parent_name, phone, address) VALUES 
  -- Halaqoh Al-Fatihah
  ('Muhammad Aqil Syahputra', 'Halaqoh Al-Fatihah', '12 tahun', 'Bapak Syahrul Rahman', '082111222333', 'Jl. Melati No. 15, Yogyakarta'),
  ('Ahmad Zaki Mubarak', 'Halaqoh Al-Fatihah', '11 tahun', 'Bapak Mubarak Ali', '082222333444', 'Jl. Mawar No. 8, Yogyakarta'),
  ('Abdullah Faris', 'Halaqoh Al-Fatihah', '13 tahun', 'Bapak Faris Hidayat', '082333444555', 'Jl. Anggrek No. 22, Yogyakarta'),
  ('Yusuf Hakim', 'Halaqoh Al-Fatihah', '12 tahun', 'Bapak Hakim Wijaya', '082444555666', 'Jl. Dahlia No. 5, Yogyakarta'),
  
  -- Halaqoh Al-Baqarah
  ('Ibrahim Khalil Rahman', 'Halaqoh Al-Baqarah', '14 tahun', 'Bapak Rahman Sholeh', '082555666777', 'Jl. Kenanga No. 12, Yogyakarta'),
  ('Umar Fadhil Akbar', 'Halaqoh Al-Baqarah', '13 tahun', 'Bapak Akbar Maulana', '082666777888', 'Jl. Tulip No. 18, Yogyakarta'),
  ('Ali Hasan Zubair', 'Halaqoh Al-Baqarah', '15 tahun', 'Bapak Zubair Ahmad', '082777888999', 'Jl. Sakura No. 7, Yogyakarta'),
  ('Hasan Basri Naufal', 'Halaqoh Al-Baqarah', '14 tahun', 'Bapak Naufal Hakim', '082888999000', 'Jl. Cempaka No. 25, Yogyakarta'),
  
  -- Halaqoh Ali Imran
  ('Khalid Walid Usman', 'Halaqoh Ali Imran', '13 tahun', 'Bapak Usman Khalid', '082999000111', 'Jl. Seroja No. 14, Yogyakarta'),
  ('Salman Farisi Amin', 'Halaqoh Ali Imran', '12 tahun', 'Bapak Amin Saleh', '082000111222', 'Jl. Kamboja No. 9, Yogyakarta'),
  ('Bilal Rabbani Syukur', 'Halaqoh Ali Imran', '14 tahun', 'Bapak Syukur Hidayat', '082111333444', 'Jl. Flamboyan No. 21, Yogyakarta'),
  ('Zaid Hamzah Ridho', 'Halaqoh Ali Imran', '13 tahun', 'Bapak Ridho Maulana', '082222444555', 'Jl. Bougenville No. 6, Yogyakarta'),
  
  -- Halaqoh An-Nisa
  ('Fatih Maulana Yusuf', 'Halaqoh An-Nisa', '15 tahun', 'Bapak Yusuf Ibrahim', '082333555666', 'Jl. Alamanda No. 17, Yogyakarta'),
  ('Dzaki Ramadhan Faiz', 'Halaqoh An-Nisa', '14 tahun', 'Bapak Faiz Rahman', '082444666777', 'Jl. Bougainvillea No. 11, Yogyakarta'),
  ('Rafif Aqila Hakim', 'Halaqoh An-Nisa', '13 tahun', 'Bapak Hakim Sholeh', '082555777888', 'Jl. Gardenia No. 23, Yogyakarta'),
  ('Naufal Azka Ridwan', 'Halaqoh An-Nisa', '15 tahun', 'Bapak Ridwan Ahmad', '082666888999', 'Jl. Jasmine No. 4, Yogyakarta'),
  
  -- Halaqoh Al-Maidah
  ('Rayhan Mufid Akbar', 'Halaqoh Al-Maidah', '12 tahun', 'Bapak Akbar Hakim', '082777999000', 'Jl. Lavender No. 19, Yogyakarta'),
  ('Fadhlan Syafiq Umar', 'Halaqoh Al-Maidah', '13 tahun', 'Bapak Umar Fadhil', '082888000111', 'Jl. Rosemary No. 13, Yogyakarta'),
  ('Ghazi Hafidz Ali', 'Halaqoh Al-Maidah', '14 tahun', 'Bapak Ali Hasan', '082999111222', 'Jl. Mint No. 26, Yogyakarta'),
  ('Rafi Dzikri Yusuf', 'Halaqoh Al-Maidah', '12 tahun', 'Bapak Yusuf Khalil', '082000222333', 'Jl. Basil No. 8, Yogyakarta'),
  
  -- Halaqoh Al-Anam
  ('Aqil Syahid Rahman', 'Halaqoh Al-Anam', '15 tahun', 'Bapak Rahman Hidayat', '082111444555', 'Jl. Oregano No. 16, Yogyakarta'),
  ('Zidan Hafidzul Haq', 'Halaqoh Al-Anam', '14 tahun', 'Bapak Haq Maulana', '082222555666', 'Jl. Thyme No. 20, Yogyakarta'),
  ('Farhan Mubarak Salim', 'Halaqoh Al-Anam', '13 tahun', 'Bapak Salim Ahmad', '082333666777', 'Jl. Sage No. 10, Yogyakarta'),
  ('Hafidz Qurrotul Ain', 'Halaqoh Al-Anam', '15 tahun', 'Bapak Ain Sholeh', '082444777888', 'Jl. Cilantro No. 24, Yogyakarta'),
  
  -- Halaqoh Al-Araf
  ('Syafiq Rabbani Faiz', 'Halaqoh Al-Araf', '13 tahun', 'Bapak Faiz Hidayat', '082555888999', 'Jl. Parsley No. 3, Yogyakarta'),
  ('Mufid Hakim Ridho', 'Halaqoh Al-Araf', '12 tahun', 'Bapak Ridho Rahman', '082666999000', 'Jl. Dill No. 27, Yogyakarta'),
  ('Dzakwan Syukur Amin', 'Halaqoh Al-Araf', '14 tahun', 'Bapak Amin Hakim', '082777000111', 'Jl. Chives No. 15, Yogyakarta'),
  ('Rasyid Maulana Haq', 'Halaqoh Al-Araf', '13 tahun', 'Bapak Haq Yusuf', '082888111222', 'Jl. Fennel No. 29, Yogyakarta'),
  
  -- Halaqoh Al-Anfal
  ('Hakim Syahrul Fadil', 'Halaqoh Al-Anfal', '15 tahun', 'Bapak Fadil Rahman', '082999222333', 'Jl. Coriander No. 12, Yogyakarta'),
  ('Ridwan Fadhil Akbar', 'Halaqoh Al-Anfal', '14 tahun', 'Bapak Akbar Hidayat', '082000333444', 'Jl. Cardamom No. 28, Yogyakarta'),
  ('Salim Hafidzul Amin', 'Halaqoh Al-Anfal', '13 tahun', 'Bapak Amin Sholeh', '082111555666', 'Jl. Turmeric No. 6, Yogyakarta'),
  ('Yusuf Mubarak Hasan', 'Halaqoh Al-Anfal', '15 tahun', 'Bapak Hasan Maulana', '082222666777', 'Jl. Ginger No. 31, Yogyakarta')
ON CONFLICT DO NOTHING;

-- Insert real schedule data
INSERT INTO schedule (halaqoh, day, sabaq_time, sabqi_time, manzil_time, location, notes) VALUES 
  ('Halaqoh Al-Fatihah', 'Senin', '06:00', '07:00', '08:00', 'Masjid Al-Ikhlas Ruang A', 'Khusus santri pemula'),
  ('Halaqoh Al-Fatihah', 'Rabu', '06:00', '07:00', '08:00', 'Masjid Al-Ikhlas Ruang A', 'Khusus santri pemula'),
  ('Halaqoh Al-Fatihah', 'Jumat', '06:00', '07:00', '08:00', 'Masjid Al-Ikhlas Ruang A', 'Khusus santri pemula'),
  
  ('Halaqoh Al-Baqarah', 'Selasa', '06:30', '07:30', '08:30', 'Masjid Al-Ikhlas Ruang B', 'Santri menengah'),
  ('Halaqoh Al-Baqarah', 'Kamis', '06:30', '07:30', '08:30', 'Masjid Al-Ikhlas Ruang B', 'Santri menengah'),
  ('Halaqoh Al-Baqarah', 'Sabtu', '06:30', '07:30', '08:30', 'Masjid Al-Ikhlas Ruang B', 'Santri menengah'),
  
  ('Halaqoh Ali Imran', 'Senin', '07:00', '08:00', '09:00', 'Masjid Al-Ikhlas Ruang C', 'Santri lanjutan'),
  ('Halaqoh Ali Imran', 'Rabu', '07:00', '08:00', '09:00', 'Masjid Al-Ikhlas Ruang C', 'Santri lanjutan'),
  ('Halaqoh Ali Imran', 'Jumat', '07:00', '08:00', '09:00', 'Masjid Al-Ikhlas Ruang C', 'Santri lanjutan'),
  
  ('Halaqoh An-Nisa', 'Selasa', '15:30', '16:30', '17:30', 'Masjid Al-Hidayah', 'Sesi sore'),
  ('Halaqoh An-Nisa', 'Kamis', '15:30', '16:30', '17:30', 'Masjid Al-Hidayah', 'Sesi sore'),
  ('Halaqoh An-Nisa', 'Sabtu', '15:30', '16:30', '17:30', 'Masjid Al-Hidayah', 'Sesi sore'),
  
  ('Halaqoh Al-Maidah', 'Senin', '16:00', '17:00', '18:00', 'Masjid Ar-Rahman', 'Sesi sore lanjutan'),
  ('Halaqoh Al-Maidah', 'Rabu', '16:00', '17:00', '18:00', 'Masjid Ar-Rahman', 'Sesi sore lanjutan'),
  ('Halaqoh Al-Maidah', 'Jumat', '16:00', '17:00', '18:00', 'Masjid Ar-Rahman', 'Sesi sore lanjutan'),
  
  ('Halaqoh Al-Anam', 'Selasa', '05:30', '06:30', '07:30', 'Masjid At-Taqwa', 'Sesi subuh'),
  ('Halaqoh Al-Anam', 'Kamis', '05:30', '06:30', '07:30', 'Masjid At-Taqwa', 'Sesi subuh'),
  ('Halaqoh Al-Anam', 'Sabtu', '05:30', '06:30', '07:30', 'Masjid At-Taqwa', 'Sesi subuh'),
  
  ('Halaqoh Al-Araf', 'Minggu', '06:00', '07:00', '08:00', 'Masjid Al-Furqan', 'Khusus hari minggu'),
  ('Halaqoh Al-Araf', 'Rabu', '19:00', '20:00', '21:00', 'Masjid Al-Furqan', 'Sesi malam'),
  ('Halaqoh Al-Araf', 'Jumat', '19:00', '20:00', '21:00', 'Masjid Al-Furqan', 'Sesi malam'),
  
  ('Halaqoh Al-Anfal', 'Minggu', '07:00', '08:00', '09:00', 'Masjid An-Nur', 'Santri senior'),
  ('Halaqoh Al-Anfal', 'Selasa', '19:30', '20:30', '21:30', 'Masjid An-Nur', 'Sesi malam lanjutan'),
  ('Halaqoh Al-Anfal', 'Kamis', '19:30', '20:30', '21:30', 'Masjid An-Nur', 'Sesi malam lanjutan')
ON CONFLICT DO NOTHING;

-- Create a real admin profile (you'll need to create the auth user separately)
-- This is just a placeholder - replace with actual admin data
INSERT INTO profiles (username, role, created_at, updated_at) VALUES 
  ('admin_tahfidz', 'admin', NOW(), NOW()),
  ('koordinator_tahfidz', 'masul_tahfidz', NOW(), NOW()),
  ('pengajar_tahfidz', 'tim_tahfidz', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
