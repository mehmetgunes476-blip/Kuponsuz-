// =====================================================
//  KUPONSUZ – ozet.js
//  Haftalık özet: pazar günü içinde bulunulan hafta,
//  diğer günler bir önceki tamamlanmış hafta özetlenir.
// =====================================================

// En sık tetikleyiciye göre gelecek hafta için tek bir öneri
const TETIK_ONERILERI = {
  "Maç izliyorum": "Gelecek hafta maç saatinde dürtü düğmesini el altında tut.",
  "Canım sıkıldı": "Sıkıldığın anlar için listene yeni bir etkinlik eklemek iyi gelebilir.",
  "Maaş yattı": "Maaş gününde kasandaki tutar kadar parayı gerçekten kenara ayırmayı dene.",
  "Para sıkıntısı": "Para sıkıntısı ağır bir tetikleyici. 115 YEDAM'ın ücretsiz desteği her zaman burada.",
  "Arkadaşlar oynuyor": "Arkadaşların oynarken ortamdan kısa bir süre uzaklaşmak ya da dürtü düğmesini açmak işe yarayabilir.",
  "Reklam gördüm": "Telefonundaki reklam ve bildirim ayarlarından bahis reklamlarını azaltmayı deneyebilirsin."
};

function ozetHaftasi() {
  const bugun = new Date();
  const buPazartesi = haftaBaslangici(bugun);
  const baslangic = bugun.getDay() === 0 ? buPazartesi : gunEkle(buPazartesi, -7);
  return { baslangic: baslangic, bitis: gunEkle(baslangic, 7) };
}

function aralikYazisi(baslangic) {
  const son = gunEkle(baslangic, 6);
  const secenek = { day: "numeric", month: "long" };
  if (baslangic.getMonth() === son.getMonth()) {
    return baslangic.getDate() + "–" + son.toLocaleDateString("tr-TR", secenek);
  }
  return baslangic.toLocaleDateString("tr-TR", secenek) + " – " + son.toLocaleDateString("tr-TR", secenek);
}

function aralikta(tarih, baslangic, bitis) {
  const gun = new Date(tarih);
  return gun >= baslangic && gun < bitis;
}

// Haftanın bütün sayılarını tek yerde hesaplar
function haftaVerisi() {
  const { baslangic, bitis } = ozetHaftasi();
  const oncekiBaslangic = gunEkle(baslangic, -7);

  const haftaKuponlari = kuponlar.filter(k => aralikta(k.tarih, baslangic, bitis));
  const haftaDurtuleri = durtuler.filter(d => aralikta(d.tarih, baslangic, bitis));

  let oynamadigiGun = 0;
  let oynadigiGun = 0;
  let harcama = 0;
  for (let i = 0; i < 7; i++) {
    const kayit = yoklamalar[gunAnahtari(gunEkle(baslangic, i))];
    if (!kayit) continue;
    if (kayit.durum === "oynamadi") oynamadigiGun += 1;
    if (kayit.durum === "oynadi") {
      oynadigiGun += 1;
      harcama += kayit.harcama || 0;
    }
  }

  const tetikler = {};
  const iseYarayan = {};
  for (const durtu of haftaDurtuleri) {
    if (durtu.tetikleyici) tetikler[durtu.tetikleyici] = (tetikler[durtu.tetikleyici] || 0) + 1;
    if (durtu.sonuc === "gecti" && durtu.etkinlik) iseYarayan[durtu.etkinlik] = (iseYarayan[durtu.etkinlik] || 0) + 1;
  }

  return {
    baslangic: baslangic,
    kupon: haftaKuponlari.length,
    oncekiKupon: kuponSayisi(oncekiBaslangic, baslangic),
    eklenen: haftaKuponlari.reduce((toplamTutar, k) => toplamTutar + k.miktar, 0),
    durtu: haftaDurtuleri.length,
    atlatilan: haftaDurtuleri.filter(d => d.sonuc === "gecti").length,
    oynamadigiGun: oynamadigiGun,
    oynadigiGun: oynadigiGun,
    harcama: harcama,
    tetikler: tetikler,
    iseYarayan: iseYarayan
  };
}

function enCokOlan(sayilar) {
  let enCok = null;
  for (const ad in sayilar) {
    if (enCok === null || sayilar[ad] > sayilar[enCok]) enCok = ad;
  }
  return enCok;
}

// ---- Özet ekranını doldur ----
function ozetiGoster() {
  const v = haftaVerisi();

  bul("ozetAralik").textContent = "Haftalık özet, " + aralikYazisi(v.baslangic);

  // Başlık: dürüst ama nazik
  let baslik = "Haftan burada.";
  let alt = "Her hafta kendini biraz daha iyi tanıyorsun.";
  if (v.kupon === 0 && v.oynadigiGun === 0 && v.oynamadigiGun > 0) {
    baslik = "Bu hafta hiç kupon yapmadın.";
    alt = "Dürtüye kapılmadan geçen bir hafta. Bu gerçekten büyük bir şey.";
  } else if (v.oncekiKupon > 0 && v.kupon < v.oncekiKupon) {
    baslik = "Geçen haftadan " + (v.oncekiKupon - v.kupon) + " kupon daha az.";
    alt = "Azaltma yolunda iyi bir hafta.";
  } else if (v.oncekiKupon > 0 && v.kupon > v.oncekiKupon) {
    baslik = "Bu hafta kupon sayın biraz arttı.";
    alt = "Zor bir hafta olmuş olabilir, ama buradasın ve bu önemli.";
  }
  bul("ozetBaslik").textContent = baslik;
  bul("ozetAlt").textContent = alt;

  // Dört sayı kutusu
  const kutular = [
    ["Kupon", String(v.kupon), "Geçen hafta " + v.oncekiKupon],
    ["Kasana eklenen", paraYaz(v.eklenen), "Toplam " + paraYaz(toplam)],
    ["Seri", guncelSeri() + " gün", "En uzunu " + enUzunSeri() + " gün"],
    ["Atlatılan dürtü", v.atlatilan + " / " + v.durtu, v.durtu === 0 ? "Bu hafta dürtü kaydı yok" : "Bu hafta"]
  ];
  const alan = bul("ozetSayilar");
  alan.innerHTML = "";
  for (const [etiket, deger, altYazi] of kutular) {
    const kutu = document.createElement("div");
    kutu.className = "istatistik";
    const e = document.createElement("span");
    e.className = "kucuk-baslik";
    e.textContent = etiket;
    const d = document.createElement("span");
    d.className = "rakam istatistik-deger";
    d.textContent = deger;
    const a = document.createElement("span");
    a.className = "soluk kucuk";
    a.textContent = altYazi;
    kutu.append(e, d, a);
    alan.append(kutu);
  }

  // Gerçek bahis günleri (sadece kayıt varsa)
  bul("ozetGercek").hidden = v.oynadigiGun === 0 && v.oynamadigiGun === 0;
  let gercek = "Yoklamada " + v.oynamadigiGun + " gün oynamadığını, " + v.oynadigiGun + " gün oynadığını işaretledin.";
  if (v.harcama > 0) {
    gercek += " O günlerde not ettiğin harcama: " + paraYaz(v.harcama) + ".";
  }
  bul("ozetGercekMetni").textContent = gercek;

  // Tetikleyiciler
  const enSikTetik = enCokOlan(v.tetikler);
  bul("ozetTetikler").hidden = enSikTetik === null;
  if (enSikTetik !== null) {
    const cubuklar = bul("ozetCubuklar");
    cubuklar.innerHTML = "";
    const enYuksek = v.tetikler[enSikTetik];
    const sirali = Object.keys(v.tetikler).sort((a, b) => v.tetikler[b] - v.tetikler[a]);
    for (const tetik of sirali) {
      const satir = document.createElement("div");
      satir.className = "cubuk-satiri";
      const ust = document.createElement("div");
      ust.className = "ozet kucuk-ozet";
      const ad = document.createElement("span");
      ad.textContent = tetik;
      const sayi = document.createElement("span");
      sayi.className = "soluk";
      sayi.textContent = v.tetikler[tetik];
      ust.append(ad, sayi);
      const cubuk = document.createElement("div");
      cubuk.className = "yatay-cubuk";
      const dolgu = document.createElement("div");
      dolgu.style.width = (v.tetikler[tetik] / enYuksek) * 100 + "%";
      cubuk.append(dolgu);
      satir.append(ust, cubuk);
      cubuklar.append(satir);
    }

    let oneri = "İsteklerinin çoğu “" + enSikTetik.toLocaleLowerCase("tr-TR") + "” anında geldi. " + TETIK_ONERILERI[enSikTetik];
    const enIyiEtkinlik = enCokOlan(v.iseYarayan);
    if (enIyiEtkinlik !== null) {
      oneri += " Bu hafta dürtülerini en çok şununla atlattın: " + enIyiEtkinlik.toLocaleLowerCase("tr-TR") + ".";
    }
    bul("ozetOneri").textContent = oneri;
  }

  // Hedef
  bul("ozetHedef").hidden = hedef === null;
  if (hedef !== null) {
    const yuzde = Math.min(100, ((toplam - hedef.baslangic) / hedef.tutar) * 100);
    const haftalik = Math.min(yuzde, (v.eklenen / hedef.tutar) * 100);
    bul("ozetHedefAdi").textContent = hedef.ad + " hedefi";
    bul("ozetHedefYuzde").textContent = "%" + Math.floor(yuzde);
    bul("ozetHedefDolgu").style.width = yuzde + "%";
    bul("ozetHedefAlt").textContent = haftalik >= 1
      ? "Bu hafta %" + Math.floor(haftalik) + " ilerledin."
      : "Bu hafta hedefinde ilerleme olmadı; kasana eklenen her kupon onu büyütecek.";
  }

  ekranaGit("ozet");
}

// ---- Kasa ekranındaki "özetin hazır" kartı ----
// Pazar ve pazartesi, o hafta için henüz açılmadıysa ve haftada bir kayıt varsa görünür
function ozetKartiniGuncelle() {
  const gun = new Date().getDay();
  const { baslangic } = ozetHaftasi();
  const v = haftaVerisi();
  const kayitVar = v.kupon > 0 || v.durtu > 0 || v.oynamadigiGun > 0 || v.oynadigiGun > 0;
  const gorulduMu = localStorage.getItem("sonGorulenOzet") === gunAnahtari(baslangic);

  bul("ozetKarti").hidden = !((gun === 0 || gun === 1) && kayitVar && !gorulduMu);
  bul("ozetKartiAralik").textContent = aralikYazisi(baslangic);
}

document.querySelectorAll(".ozet-ac").forEach(function (dugme) {
  dugme.addEventListener("click", ozetiGoster);
});

bul("ozetBitir").addEventListener("click", function () {
  localStorage.setItem("sonGorulenOzet", gunAnahtari(ozetHaftasi().baslangic));
  ozetKartiniGuncelle();
  ekranaGit("kasa");
});

// ---- Sayfa açılınca ----
ozetKartiniGuncelle();
