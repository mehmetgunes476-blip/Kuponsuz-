// =====================================================
//  KUPONSUZ – mesajlar.js
//  Motivasyon cümleleri. Yeni cümle eklemek için ilgili
//  listeye bir satır eklemen yeterli; kodun geri kalanına
//  dokunmana gerek yok.
//
//  Süslü parantez içindeki kelimeler otomatik doldurulur:
//  {seri} gün sayısı, {hedef} hedefin adı, {kalan} kalan tutar,
//  {toplam} kasadaki tutar, {sayi} tamamlanan hedef sayısı,
//  {gun} gün adı, {enUzun} en uzun seri
// =====================================================

const MESAJLAR = {
  seri: [
    "{seri} gün oldu. Dün yaptığını bugün de yapabilirsin.",
    "{seri} gündür bahse para yatırmadın. Bu küçük bir şey değil.",
    "Serin {seri} gün. Her gün biraz daha senin."
  ],
  hedef: [
    "Çok iyi gidiyorsun. {hedef} hedefine sadece {kalan} kaldı.",
    "{hedef} için {kalan} kaldı. Oynamadığın her kupon seni yaklaştırıyor.",
    "{hedef} yaklaşıyor: {kalan} kaldı."
  ],
  hedefYarisi: [
    "{hedef} hedefinin yarısından fazlası hazır. Bu senin emeğin.",
    "Yolun yarısını geçtin; {hedef} artık bir hayal değil."
  ],
  genel: [
    "Kasandaki her lira, oynamadığın bir kupondan geldi.",
    "{toplam} cebinde kaldı. Bu para artık senin planların için.",
    "Bugün oynamadığın her kupon, yarının birikimi."
  ],
  bosKasa: [
    "İlk kuponunu yaptığında paran burada birikmeye başlayacak.",
    "Canın kupon yapmak istediğinde önce buraya gel; paran cebinde kalsın."
  ],
  tamamlananlar: [
    "Şimdiye kadar {sayi} hedefi tamamladın. Bir sonrakini de yaparsın.",
    "{sayi} hedef tamamlandı. Bu, kendine verdiğin sözü tuttuğun anlamına geliyor."
  ],
  riskliGun: [
    "{gun} günleri senin için zorlayıcı olabiliyor. Dürtü düğmesi hep burada.",
    "Bugün {gun}. Kuponlarının çoğu bu günlerde geliyor; hazırlıklı ol, dürtü düğmesi burada."
  ],
  kayma: [
    "Bir gün her şeyi silmez. En uzun serin {enUzun} gün; oraya yine ulaşabilirsin.",
    "Zor bir gündü. Yarın yeniden başlıyoruz; {enUzun} günlük serin hâlâ senin."
  ],
  kaymaIlk: [
    "Bir gün her şeyi silmez. Yarın yeniden başlıyoruz.",
    "Bunu dürüstçe işaretlemen bile bir adım. Yarın yeniden başlıyoruz."
  ]
};

const GUN_TAM_ADLARI = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// Aynı gün içinde hep aynı cümle çıksın, ertesi gün değişsin
function gununSirasi() {
  const bugun = new Date();
  return bugun.getFullYear() * 400 + bugun.getMonth() * 31 + bugun.getDate();
}

// Bir listeden cümle seçip {süslü} yerleri doldurur
function mesajSec(tur, degerler) {
  const havuz = MESAJLAR[tur];
  const cumle = havuz[(gununSirasi() + tur.length) % havuz.length];
  return cumle.replace(/\{(\w+)\}/g, function (tamami, anahtar) {
    return degerler && degerler[anahtar] !== undefined ? degerler[anahtar] : tamami;
  });
}
