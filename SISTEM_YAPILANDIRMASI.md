# MoreSpace Sistem Bilgileri ve Yapılandırma Defteri

Bu dosya sistemdeki tüm kritik erişim bilgilerini ve anahtarları içerir.

## 1. Admin Paneli Erişimi
*   **Admin Şifresi (Master Key):** `J4J`
*   **Erişim Yolu:** Giriş ekranında anahtar kutusuna `J4J` yazarak direkt Admin Paneline geçiş yapabilirsiniz.

## 2. Veritabanı Bilgileri (Merkezi Firebase)
*   **Servis:** Cloud Firestore (Shared Core) - `morespace-b1155`
*   **Yöntem:** Dış sistemlerce üretilen anahtarlar Firebase'e kaydedilir, MoreSpace oradan okur.
*   **Silme Mantığı:** Bir anahtarın süresi dolduğunda, hem 'users' hem de 'tokens' listesinden KALICI OLARAK silinir.

## 3. Servis Anahtarları
*   **E-posta Servisi (Resend):** (Eğer `.env` dosyasında tanımlıysa aktifleşir)
*   **Port:** 3000

## 4. Kullanım İpuçları
*   Yeni bir kullanıcı eklemek için önce Admin Paneline `J4J` ile girin.
*   "TOKEN OLUŞTUR" butonuna basarak rastgele bir anahtar üretin.
*   Ürettiğiniz o anahtarı kullanıcıya verin.
*   Kullanıcı anahtarı girdiğinde veritabanına kaydedilir ve süresi başlar.

---
*Not: Bu dosya sistem yönetimi için referans amaçlı oluşturulmuştur.*
