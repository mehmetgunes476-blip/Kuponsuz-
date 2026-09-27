// =====================================================
//  KUPONSUZ – app.js
// =====================================================

// ---- Kayıtlı verileri yükle ----
let toplam = Number(localStorage.getItem("toplam")) || 0;
let kuponlar = JSON.parse(localStorage.getItem("kuponlar")) || [];
let hedef = JSON.parse(localStorage.getItem("hedef"));
let tamamlananHedefler = JSON.parse(localStorage.getItem("tamamlananHedefler")) || [];
let sonrakiBaslangic = Number(localStorage.getItem("sonrakiBaslangic")) || 0;
let kazanilanRozetler = JSON.parse(localStorage.getItem("kazanilanRozetler")) || [];
let durtuler = JSON.parse(localStorage.getItem("durtuler")) || [];
let yoklamalar = JSON.parse(localStorage.getItem("yoklamalar")) || {};   // { "2026-09-27": { durum: "oynamadi" } }

// ---- Sadece bu oturumda tutulan durum ----
let secilenMaclar = [];
let seciliTur = "MS 1";
let aktifSekme = "bekleyen";
let bildirimZamanlayici = null;

// =====================================================
//  YARDIMCI FONKSİYONLAR
// =====================================================
function bul(id) {
  return document.getElementById(id);
}

function sayiYaz(sayi) {
  return sayi.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function paraYaz(sayi) {
  return sayiYaz(sayi) + " TL";
}

// "1,85" ya da "1.85" -> 1.85
function oranOku(metin) {
  return Number(String(metin).trim().replace(",", "."));
}

// "15.000" -> 15000, "250,50" -> 250.5
function tutarOku(metin) {
  return Number(String(metin).trim().replace(/\./g, "").replace(",", "."));
}

function kaydet() {
  localStorage.setItem("toplam", toplam);
  localStorage.setItem("kuponlar", JSON.stringify(kuponlar));
  localStorage.setItem("hedef", JSON.stringify(hedef));
  localStorage.setItem("tamamlananHedefler", JSON.stringify(tamamlananHedefler));
  localStorage.setItem("sonrakiBaslangic", sonrakiBaslangic);
  localStorage.setItem("kazanilanRozetler", JSON.stringify(kazanilanRozetler));
  localStorage.setItem("durtuler", JSON.stringify(durtuler));
  localStorage.setItem("yoklamalar", JSON.stringify(yoklamalar));
}

function bildirimGoster(metin) {
  const kutu = bul("bildirim");
  kutu.textContent = metin;
  kutu.classList.add("gorunur");
  clearTimeout(bildirimZamanlayici);
  bildirimZamanlayici = setTimeout(function () {
    kutu.classList.remove("gorunur");
  }, 3500);
}

// Simgeler: sadece çizim kısmı, çerçeveyi svg() fonksiyonu ekliyor
const IKONLAR = {
  para: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  hedef: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8"/>',
  azalma: '<path d="M3 7l6 6 4-4 8 8M21 11v6h-6"/>',
  dalga: '<path d="M2 11c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-2"/><path d="M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1.5"/>',
  takvim: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4"/>',
  kupon: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M9 10l6 4M15 10l-6 4"/>',
  filiz: '<path d="M12 21v-9"/><path d="M12 12c0-4-3-6.5-7-6.5 0 4 3 6.5 7 6.5z"/><path d="M12 14.5c0-3.2 2.4-5.5 6.5-5.5 0 3.2-2.4 5.5-6.5 5.5z"/>',
  tik: '<path d="M5 12l5 5 9-10"/>',
  kapat: '<path d="M6 6l12 12M18 6 6 18"/>'
};

function svg(cizim, boyut) {
  return '<svg width="' + boyut + '" height="' + boyut + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + cizim + '</svg>';
}

// =====================================================
//  EKRANLAR ARASI GEÇİŞ
// =====================================================
function ekranaGit(ad) {
  document.querySelectorAll(".ekran").forEach(function (ekran) {
    ekran.hidden = ekran.id !== "ekran-" + ad;
  });
  document.querySelectorAll(".menu-dugme").forEach(function (dugme) {
    if (dugme.dataset.git === ad) {
      dugme.setAttribute("aria-current", "page");
    } else {
      dugme.removeAttribute("aria-current");
    }
  });
  // Dürtü ekranlarında alt menü gizlenir, kişi o ana odaklansın
  document.body.classList.toggle("tam-ekran", ad === "durtu" || ad === "durtu-sonuc" || ad === "zor-gun" || ad === "ozet");
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-git]").forEach(function (dugme) {
  dugme.addEventListener("click", function () {
    ekranaGit(dugme.dataset.git);
  });
});

bul("destekAc").addEventListener("click", function () {
  ekranaGit("destek");
});

// =====================================================
//  HESAPLAMALAR
// =====================================================
function toplamOranHesapla() {
  let oran = 1;
  for (const mac of secilenMaclar) {
    oran = oran * mac.oran;
  }
  return oran;
}

function netSonucHesapla() {
  let net = 0;
  let sonuclanan = 0;
  for (const kupon of kuponlar) {
    if (kupon.durum === "tuttu") {
      net = net + kupon.miktar * kupon.toplamOran - kupon.miktar;
      sonuclanan = sonuclanan + 1;
    } else if (kupon.durum === "yatti") {
      net = net - kupon.miktar;
      sonuclanan = sonuclanan + 1;
    }
  }
  return { net: net, sonuclanan: sonuclanan };
}

// Verilen tarihin haftasının pazartesi 00:00'ı
function haftaBaslangici(tarih) {
  const gun = new Date(tarih);
  const pazartesidenBeri = (gun.getDay() + 6) % 7;
  gun.setHours(0, 0, 0, 0);
  gun.setDate(gun.getDate() - pazartesidenBeri);
  return gun;
}

function kuponSayisi(baslangic, bitis) {
  return kuponlar.filter(function (kupon) {
    const tarih = new Date(kupon.tarih);
    return tarih >= baslangic && tarih < bitis;
  }).length;
}

// Tamamlanmış son iki haftanın kupon sayıları
function haftalikKarsilastirma() {
  const buHafta = haftaBaslangici(new Date());
  const gecenHafta = new Date(buHafta);
  gecenHafta.setDate(gecenHafta.getDate() - 7);
  const oncekiHafta = new Date(buHafta);
  oncekiHafta.setDate(oncekiHafta.getDate() - 14);
  return {
    gecen: kuponSayisi(gecenHafta, buHafta),
    onceki: kuponSayisi(oncekiHafta, gecenHafta)
  };
}

// ---- Günlük yoklama ve seriler ----

// Tarihi "2026-09-27" biçiminde, telefonun kendi saatine göre yazar
function gunAnahtari(tarih) {
  const gun = new Date(tarih);
  return gun.getFullYear() + "-" +
    String(gun.getMonth() + 1).padStart(2, "0") + "-" +
    String(gun.getDate()).padStart(2, "0");
}

function gunEkle(tarih, kacGun) {
  const gun = new Date(tarih);
  gun.setDate(gun.getDate() + kacGun);
  return gun;
}

function bugununYoklamasi() {
  return yoklamalar[gunAnahtari(new Date())] || null;
}

// Bugünden (bugün henüz işaretlenmediyse dünden) geriye doğru
// arka arkaya kaç gün "oynamadım" denmiş?
function guncelSeri() {
  let gun = new Date();
  const bugun = bugununYoklamasi();
  if (bugun && bugun.durum === "oynadi") return 0;
  if (!bugun) gun = gunEkle(gun, -1);

  let seri = 0;
  while (yoklamalar[gunAnahtari(gun)] && yoklamalar[gunAnahtari(gun)].durum === "oynamadi") {
    seri = seri + 1;
    gun = gunEkle(gun, -1);
  }
  return seri;
}

function enUzunSeri() {
  const gunler = Object.keys(yoklamalar)
    .filter(anahtar => yoklamalar[anahtar].durum === "oynamadi")
    .sort();

  let enUzun = 0;
  let simdiki = 0;
  let onceki = null;
  for (const anahtar of gunler) {
    const gun = new Date(anahtar + "T12:00:00");
    const ardArda = onceki !== null && Math.round((gun - onceki) / 86400000) === 1;
    simdiki = ardArda ? simdiki + 1 : 1;
    enUzun = Math.max(enUzun, simdiki);
    onceki = gun;
  }
  return enUzun;
}

// Son kupondan (hiç kupon yoksa başlangıçtan) bu yana geçen gün
function kuponsuzGunSayisi() {
  const profil = JSON.parse(localStorage.getItem("profil")) || {};
  let baslangic = profil.baslangicTarihi ? new Date(profil.baslangicTarihi) : new Date();
  if (kuponlar.length > 0) {
    baslangic = new Date(kuponlar[kuponlar.length - 1].tarih);
  }
  return Math.floor((Date.now() - baslangic) / 86400000);
}

// =====================================================
//  ROZETLER
// =====================================================
// Yeni bir rozet eklemek için bu listeye bir satır eklemen yeterli.
const ROZETLER = [
  {
    id: "seri-3", grup: "Seriler", ad: "3 gün", ikon: "takvim",
    gereken: 3, deger: () => enUzunSeri(), alt: () => guncelSeri() + " / 3 gün"
  },
  {
    id: "seri-5", grup: "Seriler", ad: "5 gün", ikon: "takvim",
    gereken: 5, deger: () => enUzunSeri(), alt: () => guncelSeri() + " / 5 gün"
  },
  {
    id: "seri-14", grup: "Seriler", ad: "14 gün", ikon: "takvim",
    gereken: 14, deger: () => enUzunSeri(), alt: () => guncelSeri() + " / 14 gün"
  },
  {
    id: "seri-30", grup: "Seriler", ad: "30 gün", ikon: "takvim",
    gereken: 30, deger: () => enUzunSeri(), alt: () => guncelSeri() + " / 30 gün"
  },
  {
    id: "birikim-5000", grup: "Birikim", ad: "5.000 TL", ikon: "para",
    gereken: 5000, deger: () => toplam, alt: () => paraYaz(toplam)
  },
  {
    id: "birikim-10000", grup: "Birikim", ad: "10.000 TL", ikon: "para",
    gereken: 10000, deger: () => toplam, alt: () => paraYaz(toplam)
  },
  {
    id: "birikim-25000", grup: "Birikim", ad: "25.000 TL", ikon: "para",
    gereken: 25000, deger: () => toplam, alt: () => paraYaz(toplam)
  },
  {
    id: "ilk-hedef", grup: "Azaltma", ad: "İlk hedef", ikon: "hedef",
    gereken: 1, deger: () => tamamlananHedefler.length, alt: () => "İlk hedefini tamamla"
  },
  {
    id: "az-kupon", grup: "Azaltma", ad: "Daha az kupon", ikon: "azalma",
    gereken: 1,
    deger: function () {
      const hafta = haftalikKarsilastirma();
      return hafta.onceki > 0 && hafta.gecen < hafta.onceki ? 1 : 0;
    },
    alt: () => "Bir haftayı öncekinden az kuponla bitir"
  },
  {
    id: "kuponsuz-hafta", grup: "Azaltma", ad: "Kuponsuz hafta", ikon: "kupon",
    gereken: 7, deger: () => kuponsuzGunSayisi(), alt: () => "7 gün hiç kupon yapma"
  },
  {
    id: "dalga-1", grup: "Dürtüler", ad: "İlk dalga", ikon: "dalga",
    gereken: 1, deger: () => atlatilanDurtuSayisi(), alt: () => "İlk dürtünü atlat"
  },
  {
    id: "dalga-5", grup: "Dürtüler", ad: "5 dalga", ikon: "dalga",
    gereken: 5, deger: () => atlatilanDurtuSayisi(), alt: () => atlatilanDurtuSayisi() + " / 5"
  },
  {
    id: "dalga-10", grup: "Dürtüler", ad: "10 dalga", ikon: "dalga",
    gereken: 10, deger: () => atlatilanDurtuSayisi(), alt: () => atlatilanDurtuSayisi() + " / 10"
  }
];

const ROZET_GRUPLARI = ["Seriler", "Birikim", "Azaltma", "Dürtüler"];

function atlatilanDurtuSayisi() {
  return durtuler.filter(d => d.sonuc === "gecti").length;
}

function rozetleriKontrolEt() {
  for (const rozet of ROZETLER) {
    const zatenVar = kazanilanRozetler.includes(rozet.id);
    if (!zatenVar && rozet.deger() >= rozet.gereken) {
      kazanilanRozetler.push(rozet.id);
      bildirimGoster("Yeni rozet: " + rozet.ad + ". Başardın!");
    }
  }
  kaydet();
}

function basarilariGoster() {
  const alan = bul("rozetGruplari");
  alan.innerHTML = "";

  ROZET_GRUPLARI.forEach(function (grup) {
    const kart = document.createElement("section");
    kart.className = "kart";

    const baslik = document.createElement("h2");
    baslik.textContent = grup;

    const izgara = document.createElement("div");
    izgara.className = "rozet-izgara";

    ROZETLER.filter(r => r.grup === grup).forEach(function (rozet) {
      const kazanildi = kazanilanRozetler.includes(rozet.id);

      const kutu = document.createElement("div");
      kutu.className = kazanildi ? "rozet kazanildi" : "rozet";

      const madalyon = document.createElement("div");
      madalyon.className = "madalyon";
      madalyon.innerHTML = svg(IKONLAR[rozet.ikon], 26);

      const ad = document.createElement("span");
      ad.className = "rozet-adi";
      ad.textContent = rozet.ad;

      kutu.append(madalyon, ad);

      if (!kazanildi) {
        const cubuk = document.createElement("div");
        cubuk.className = "mini-cubuk";
        const dolgu = document.createElement("div");
        dolgu.style.width = Math.min(100, (rozet.deger() / rozet.gereken) * 100) + "%";
        cubuk.append(dolgu);
        kutu.append(cubuk);
      }

      const alt = document.createElement("span");
      alt.className = "rozet-alt";
      alt.textContent = kazanildi ? "Kazanıldı" : rozet.alt();
      kutu.append(alt);

      izgara.append(kutu);
    });

    kart.append(baslik, izgara);
    alan.append(kart);
  });

  const kazanilanSayi = ROZETLER.filter(r => kazanilanRozetler.includes(r.id)).length;
  bul("rozetOzeti").textContent = "Kazandığın rozetler: " + kazanilanSayi + " / " + ROZETLER.length;

  // Tamamlanan hedefler listesi
  const liste = bul("rozetler");
  liste.innerHTML = "";
  bul("hedefRozetleri").hidden = tamamlananHedefler.length === 0;
  for (const tamamlanan of tamamlananHedefler) {
    const satir = document.createElement("li");
    const ad = document.createElement("span");
    ad.textContent = tamamlanan.ad;
    const tutar = document.createElement("strong");
    tutar.className = "rakam";
    tutar.textContent = paraYaz(tamamlanan.tutar);
    satir.append(ad, tutar);
    liste.append(satir);
  }
}

// =====================================================
//  KASA VE HEDEF
// =====================================================
function kasayiGuncelle() {
  bul("tutar").textContent = sayiYaz(toplam);

  const sonuc = netSonucHesapla();
  const netYazi = bul("netSonuc");
  if (sonuc.sonuclanan === 0) {
    netYazi.textContent = "Kuponların sonuçlandıkça, oynasaydın ne olacağını burada göreceksin.";
  } else if (sonuc.net < 0) {
    netYazi.textContent = "Sonuçlanan " + sonuc.sonuclanan + " kuponunu gerçekten oynasaydın net " + paraYaz(-sonuc.net) + " kaybedecektin.";
  } else {
    netYazi.textContent = "Sonuçlanan " + sonuc.sonuclanan + " kuponda şimdilik net " + paraYaz(sonuc.net) + " öndesin, ama bu tablo uzun vadede nadiren böyle kalır.";
  }

  hedefiGuncelle();
  motivasyonGuncelle();
  rozetleriKontrolEt();
  basarilariGoster();
}

function hedefiGuncelle() {
  if (hedef === null) {
    bul("hedefFormu").hidden = false;
    bul("hedefIlerleme").hidden = true;
    return;
  }

  const biriken = toplam - hedef.baslangic;

  // Hedefe ulaşıldı mı?
  if (biriken >= hedef.tutar) {
    tamamlananHedefler.push({ ad: hedef.ad, tutar: hedef.tutar, tarih: new Date().toISOString() });
    sonrakiBaslangic = hedef.baslangic + hedef.tutar;
    const mesaj = "Tebrikler! Bahis oynamayarak " + hedef.ad.toLocaleLowerCase("tr-TR") + " parasını biriktirdin.";
    bul("hedefMesaji").textContent = mesaj;
    bildirimGoster(mesaj);
    hedef = null;
    kaydet();
    hedefiGuncelle();
    return;
  }

  const yuzde = Math.min(100, (biriken / hedef.tutar) * 100);
  const cevre = 2 * Math.PI * 38; // halkanın çevresi

  bul("hedefFormu").hidden = true;
  bul("hedefIlerleme").hidden = false;
  bul("halkaDolgu").setAttribute("stroke-dasharray", (cevre * yuzde / 100) + " " + cevre);
  bul("hedefYuzde").textContent = "%" + Math.floor(yuzde);
  bul("hedefBaslik").textContent = hedef.ad;
  bul("hedefDurum").textContent = sayiYaz(biriken) + " / " + paraYaz(hedef.tutar);
  bul("hedefKalan").textContent = paraYaz(hedef.tutar - biriken) + " kaldı";
}

function motivasyonGuncelle() {
  // Bugün "oynadım" dendiyse tek mesaj: şefkat
  const yazi = bul("motivasyonYazisi");
  const bugun = bugununYoklamasi();
  if (bugun && bugun.durum === "oynadi") {
    const enUzun = enUzunSeri();
    yazi.textContent = enUzun > 0 ? mesajSec("kayma", { enUzun: enUzun }) : mesajSec("kaymaIlk");
    return;
  }

  // Bugün kişinin en çok kupon yaptığı günse, önceden uyar
  const riskli = riskliGun();
  if (riskli !== null) {
    yazi.textContent = mesajSec("riskliGun", { gun: riskli });
    return;
  }

  // Duruma uyan mesaj türlerini topla, birini seç
  const secenekler = [];

  const seri = guncelSeri();
  if (seri >= 2) {
    secenekler.push(["seri", { seri: seri }]);
  }

  if (hedef !== null) {
    const biriken = toplam - hedef.baslangic;
    const degerler = { hedef: hedef.ad, kalan: paraYaz(hedef.tutar - biriken) };
    secenekler.push(["hedef", degerler]);
    if (biriken >= hedef.tutar / 2) {
      secenekler.push(["hedefYarisi", degerler]);
    }
  }

  if (toplam > 0) {
    secenekler.push(["genel", { toplam: paraYaz(toplam) }]);
  } else {
    secenekler.push(["bosKasa", {}]);
  }

  if (tamamlananHedefler.length > 0) {
    secenekler.push(["tamamlananlar", { sayi: tamamlananHedefler.length }]);
  }

  const secilen = secenekler[gununSirasi() % secenekler.length];
  yazi.textContent = mesajSec(secilen[0], secilen[1]);
}

// Kuponların en çok yapıldığı gün bugünse o günün adını döndürür
function riskliGun() {
  if (kuponlar.length < 4) return null;

  const sayac = [0, 0, 0, 0, 0, 0, 0];   // pazartesiden pazara
  for (const kupon of kuponlar) {
    sayac[(new Date(kupon.tarih).getDay() + 6) % 7] += 1;
  }
  const enCok = Math.max(...sayac);
  const enCokGun = sayac.indexOf(enCok);
  const bugunIndeks = (new Date().getDay() + 6) % 7;

  // Belirgin bir yoğunluk yoksa uyarma
  if (enCok < 3 || enCok / kuponlar.length < 0.3) return null;
  return bugunIndeks === enCokGun ? GUN_TAM_ADLARI[enCokGun] : null;
}

bul("hedefKaydet").addEventListener("click", function () {
  const ad = bul("hedefAdi").value.trim();
  const tutar = tutarOku(bul("hedefTutari").value);

  if (ad === "" || !(tutar > 0)) {
    bul("hedefMesaji").textContent = "Hedefin adını ve tutarını gir.";
    return;
  }

  hedef = { ad: ad, tutar: tutar, baslangic: sonrakiBaslangic };
  bul("hedefAdi").value = "";
  bul("hedefTutari").value = "";
  bul("hedefMesaji").textContent = "";
  kaydet();
  kasayiGuncelle();
});

bul("hedefDegistir").addEventListener("click", function () {
  hedef = null;
  kaydet();
  kasayiGuncelle();
});

// =====================================================
//  YENİ KUPON
// =====================================================
function mesajGoster(metin, hataMi) {
  const mesaj = bul("mesaj");
  mesaj.textContent = metin;
  mesaj.style.color = hataMi ? "var(--hata)" : "var(--yaprak)";
}

function cipleriGuncelle() {
  document.querySelectorAll("#bahisTurleri .cip").forEach(function (cip) {
    cip.setAttribute("aria-pressed", cip.dataset.tur === seciliTur ? "true" : "false");
  });
  const kendin = seciliTur === "kendin";
  bul("kendiTurAlani").hidden = !kendin;
  bul("oranAlani").className = kendin ? "alan dar" : "alan tam";
}

document.querySelectorAll("#bahisTurleri .cip").forEach(function (cip) {
  cip.addEventListener("click", function () {
    seciliTur = cip.dataset.tur;
    cipleriGuncelle();
    if (seciliTur === "kendin") {
      bul("kendiTur").focus();
    }
  });
});

function kazanciGuncelle() {
  const miktar = tutarOku(bul("miktar").value);
  if (secilenMaclar.length === 0 || !(miktar > 0)) {
    bul("olasiKazanc").textContent = "-";
    return;
  }
  bul("olasiKazanc").textContent = paraYaz(miktar * toplamOranHesapla());
}

function kuponuGoster() {
  const liste = bul("macListesi");
  liste.innerHTML = "";

  if (secilenMaclar.length === 0) {
    bul("kuponBasligi").textContent = "Kuponun";
    const bos = document.createElement("li");
    bos.className = "bos-durum";
    bos.textContent = "Kuponun henüz boş. Yukarıdan maç ekleyerek başla.";
    liste.append(bos);
  } else {
    bul("kuponBasligi").textContent = "Kuponun, " + secilenMaclar.length + " maç";
  }

  secilenMaclar.forEach(function (mac, sira) {
    const satir = document.createElement("li");

    const bilgi = document.createElement("div");
    bilgi.className = "mac-bilgi";
    const ad = document.createElement("span");
    ad.className = "mac-adi";
    ad.textContent = mac.mac;
    const tahmin = document.createElement("span");
    tahmin.className = "mac-tahmin";
    tahmin.textContent = mac.tahmin;
    bilgi.append(ad, tahmin);

    const oran = document.createElement("span");
    oran.className = "rakam mac-oran";
    oran.textContent = mac.oran.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const sil = document.createElement("button");
    sil.className = "sil";
    sil.setAttribute("aria-label", "Maçı kupondan çıkar");
    sil.innerHTML = svg(IKONLAR.kapat, 18);
    sil.addEventListener("click", function () {
      secilenMaclar.splice(sira, 1);
      kuponuGoster();
    });

    satir.append(bilgi, oran, sil);
    liste.append(satir);
  });

  bul("toplamOran").textContent = secilenMaclar.length === 0
    ? "-"
    : toplamOranHesapla().toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  kazanciGuncelle();
}

bul("macEkle").addEventListener("click", function () {
  const macAdi = bul("mac").value.trim();
  const oran = oranOku(bul("oran").value);
  const tahmin = seciliTur === "kendin" ? bul("kendiTur").value.trim() : seciliTur;

  if (macAdi === "") {
    mesajGoster("Önce maçı yaz.", true);
    return;
  }
  if (tahmin === "") {
    mesajGoster("Bahsini yaz; örneğin \"Ev sahibi en az 2 gol atar\".", true);
    return;
  }
  if (!(oran > 1)) {
    mesajGoster("Oran 1'den büyük olmalı; örneğin 1,85.", true);
    return;
  }

  secilenMaclar.push({
    mac: macAdi,
    tahmin: tahmin,
    oran: oran,
    serbest: seciliTur === "kendin"
  });

  bul("mac").value = "";
  bul("oran").value = "";
  bul("kendiTur").value = "";
  mesajGoster("", false);
  kuponuGoster();
});

bul("miktar").addEventListener("input", kazanciGuncelle);

bul("onayla").addEventListener("click", function () {
  const miktar = tutarOku(bul("miktar").value);

  if (secilenMaclar.length === 0) {
    mesajGoster("Önce kupona en az bir maç ekle.", true);
    return;
  }
  if (!(miktar > 0)) {
    mesajGoster("Kupona yatıracağın tutarı yaz.", true);
    return;
  }

  kuponlar.push({
    tarih: new Date().toISOString(),
    maclar: secilenMaclar,
    miktar: miktar,
    toplamOran: toplamOranHesapla(),
    durum: "bekliyor"
  });
  toplam = toplam + miktar;
  kaydet();

  mesajGoster("Onaylandı. Bu kuponu gerçekten oynasaydın " + paraYaz(miktar) + " cebinden çıkacaktı; o para artık kasanda.", false);

  secilenMaclar = [];
  bul("miktar").value = "";
  kuponuGoster();
  kasayiGuncelle();
  kuponlarimiGoster();
});

// =====================================================
//  KUPONLARIM
// =====================================================
function sonuclandir(kupon, durum) {
  kupon.durum = durum;
  kaydet();
  kuponlarimiGoster();
  kasayiGuncelle();
}

document.querySelectorAll(".segment-dugme").forEach(function (dugme) {
  dugme.addEventListener("click", function () {
    aktifSekme = dugme.dataset.sekme;
    kuponlarimiGoster();
  });
});

function kuponlarimiGoster() {
  const bekleyenler = kuponlar.filter(k => k.durum === "bekliyor");
  const sonuclananlar = kuponlar.filter(k => k.durum !== "bekliyor");

  // Sekme düğmeleri
  bul("sekmeBekleyen").textContent = "Bekleyen (" + bekleyenler.length + ")";
  bul("sekmeSonuclanan").textContent = "Sonuçlanan (" + sonuclananlar.length + ")";
  bul("sekmeBekleyen").setAttribute("aria-pressed", aktifSekme === "bekleyen" ? "true" : "false");
  bul("sekmeSonuclanan").setAttribute("aria-pressed", aktifSekme === "sonuclanan" ? "true" : "false");

  // Net sonuç şeridi
  const sonuc = netSonucHesapla();
  if (sonuc.sonuclanan === 0) {
    bul("netSeritYazi").textContent = "Kuponların sonuçlandıkça, oynasaydın net sonucunu burada göreceksin.";
    bul("netSeritTutar").textContent = "";
  } else {
    bul("netSeritYazi").textContent = sonuc.sonuclanan + " kupon sonuçlandı. Hepsini oynasaydın net sonucun:";
    bul("netSeritTutar").textContent = (sonuc.net < 0 ? "−" : "+") + paraYaz(Math.abs(sonuc.net));
  }

  // Liste (en yeni en üstte)
  const liste = bul("kuponListesi");
  liste.innerHTML = "";
  const gosterilecek = (aktifSekme === "bekleyen" ? bekleyenler : sonuclananlar).slice().reverse();

  if (gosterilecek.length === 0) {
    const bos = document.createElement("li");
    bos.className = "bos-durum";
    bos.textContent = aktifSekme === "bekleyen"
      ? "Bekleyen kuponun yok. Yaptığın kuponlar burada sonuçlanmayı bekler."
      : "Henüz sonuçlanan kupon yok.";
    liste.append(bos);
    return;
  }

  for (const kupon of gosterilecek) {
    const kart = document.createElement("li");
    kart.className = "kupon";

    const ust = document.createElement("div");
    ust.className = "kupon-ust";
    const tarih = document.createElement("span");
    tarih.textContent = new Date(kupon.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) + ", " + kupon.maclar.length + " maç";
    const tutar = document.createElement("strong");
    tutar.className = "rakam";
    tutar.textContent = paraYaz(kupon.miktar);
    ust.append(tarih, tutar);
    kart.append(ust);

    const maclar = document.createElement("div");
    maclar.className = "kupon-maclari";
    for (const mac of kupon.maclar) {
      const satir = document.createElement("div");
      satir.textContent = mac.mac;
      const tahmin = document.createElement("span");
      tahmin.className = "mac-tahmin";
      tahmin.textContent = mac.tahmin;
      satir.append(tahmin);
      maclar.append(satir);
    }
    kart.append(maclar);

    if (kupon.durum === "bekliyor") {
      const dugmeler = document.createElement("div");
      dugmeler.className = "kupon-dugmeler";

      const tuttu = document.createElement("button");
      tuttu.className = "buton cizgili kucuk";
      tuttu.textContent = "Tuttu";
      tuttu.addEventListener("click", () => sonuclandir(kupon, "tuttu"));

      const yatti = document.createElement("button");
      yatti.className = "buton cizgili kucuk";
      yatti.textContent = "Yattı";
      yatti.addEventListener("click", () => sonuclandir(kupon, "yatti"));

      dugmeler.append(tuttu, yatti);
      kart.append(dugmeler);
    } else {
      const etiket = document.createElement("span");
      etiket.className = "durum-etiketi";
      etiket.textContent = kupon.durum === "tuttu" ? "Tuttu" : "Yattı";
      kart.append(etiket);
    }

    liste.append(kart);
  }
}

// =====================================================
//  SAYFA AÇILINCA
// =====================================================
cipleriGuncelle();
kuponuGoster();
kasayiGuncelle();
kuponlarimiGoster();
