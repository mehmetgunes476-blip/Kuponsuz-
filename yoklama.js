// =====================================================
//  KUPONSUZ – yoklama.js
//  Günlük "bugün gerçek parayla bahis oynadın mı?" sorusu
// =====================================================

const GUN_ADLARI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SERI_ESIKLERI = [3, 5, 14, 30];   // seri rozetlerinin gün sayıları

function sonrakiEsik(seri) {
  return SERI_ESIKLERI.find(esik => esik > seri) || null;
}

// ---- Haftanın yedi günü ----
function haftayiGoster() {
  const alan = bul("haftaGunleri");
  alan.innerHTML = "";

  const bugunAnahtar = gunAnahtari(new Date());
  const pazartesi = haftaBaslangici(new Date());

  for (let i = 0; i < 7; i++) {
    const gun = gunEkle(pazartesi, i);
    const anahtar = gunAnahtari(gun);
    const kayit = yoklamalar[anahtar];
    const bugunMu = anahtar === bugunAnahtar;

    const kutu = document.createElement("div");
    kutu.className = "gun";

    const daire = document.createElement("div");
    let aciklama = "işaretlenmedi";

    if (kayit && kayit.durum === "oynamadi") {
      daire.className = bugunMu ? "gun-daire tamam parlak" : "gun-daire tamam";
      daire.innerHTML = svg(IKONLAR.tik, 16);
      aciklama = "oynamadın";
    } else if (kayit && kayit.durum === "oynadi") {
      daire.className = "gun-daire kaydi";
      aciklama = "zor bir gündü";
    } else if (bugunMu) {
      daire.className = "gun-daire bugun";
      aciklama = "bugün, henüz işaretlenmedi";
    } else if (gun > new Date()) {
      daire.className = "gun-daire gelecek";
      aciklama = "henüz gelmedi";
    } else {
      daire.className = "gun-daire";
    }

    const ad = document.createElement("span");
    ad.className = bugunMu ? "gun-adi bugun-adi" : "gun-adi";
    ad.textContent = GUN_ADLARI[i];

    kutu.setAttribute("aria-label", GUN_ADLARI[i] + ": " + aciklama);
    kutu.append(daire, ad);
    alan.append(kutu);
  }
}

// ---- Kartın durumu ----
function yoklamayiGoster() {
  haftayiGoster();

  const bugun = bugununYoklamasi();
  const seri = guncelSeri();
  const simge = bul("yoklamaSimge");

  bul("yoklamaDugmeleri").hidden = bugun !== null;
  bul("yoklamaSonuc").hidden = bugun === null;
  bul("yoklamaDegistir").hidden = bugun === null;

  // Henüz işaretlenmedi
  if (bugun === null) {
    const esik = sonrakiEsik(seri);
    let metin = "Her gün buraya dokunarak serini büyüt.";
    if (seri > 0) {
      metin = seri + " günlük serin var.";
      if (esik !== null) {
        const kalan = esik - seri;
        metin += kalan === 1
          ? " Bir gün daha, yeni rozet."
          : " " + kalan + " gün sonra " + esik + " günlük seri rozeti.";
      }
    }
    bul("yoklamaDurum").textContent = metin;
    return;
  }

  bul("yoklamaDurum").textContent = "";

  // Bugün oynamadı
  if (bugun.durum === "oynamadi") {
    simge.className = "kucuk-madalyon kazanc";
    simge.innerHTML = svg(IKONLAR.takvim, 22);
    bul("yoklamaBaslik").textContent = seri === 1 ? "Harika, ilk gün tamam!" : seri + " gün oldu, başardın!";

    const esik = sonrakiEsik(seri);
    if (SERI_ESIKLERI.includes(seri)) {
      bul("yoklamaAlt").textContent = seri + " günlük seri rozeti artık senin. Yarın da buradayız.";
    } else if (esik !== null) {
      bul("yoklamaAlt").textContent = "Sonraki rozete " + (esik - seri) + " gün kaldı. Yarın da buradayız.";
    } else {
      bul("yoklamaAlt").textContent = "Yarın da buradayız.";
    }
    return;
  }

  // Bugün oynadı
  simge.className = "kucuk-madalyon";
  simge.innerHTML = svg(IKONLAR.filiz, 22);
  bul("yoklamaBaslik").textContent = "Bugünü not ettik.";
  bul("yoklamaAlt").textContent = "Yarın yeniden başlıyoruz. Zor anlarda dürtü düğmesi burada.";
}

// ---- Düğmeler ----
bul("oynamadim").addEventListener("click", function () {
  yoklamalar[gunAnahtari(new Date())] = { durum: "oynamadi" };
  kaydet();
  yoklamayiGoster();
  kasayiGuncelle();   // motivasyon cümlesi ve rozetler güncellensin
});

bul("oynadim").addEventListener("click", function () {
  yoklamalar[gunAnahtari(new Date())] = { durum: "oynadi" };
  kaydet();

  const enUzun = enUzunSeri();
  bul("zorGunMetni").textContent = enUzun > 0
    ? "Serin sıfırlandı, ama geride bıraktığın günler hâlâ senin. En uzun serin " + enUzun + " gündü; oraya yeniden ulaşabilirsin."
    : "Bunu dürüstçe işaretlemen bile bir adım. Yarın yeniden başlıyoruz.";
  bul("harcama").value = "";

  yoklamayiGoster();
  kasayiGuncelle();
  ekranaGit("zor-gun");
});

bul("yarinBasla").addEventListener("click", function () {
  const harcama = tutarOku(bul("harcama").value);
  const kayit = bugununYoklamasi();
  if (kayit && harcama > 0) {
    kayit.harcama = harcama;
    kaydet();
  }
  ekranaGit("kasa");
});

bul("yoklamaDegistir").addEventListener("click", function () {
  delete yoklamalar[gunAnahtari(new Date())];
  kaydet();
  yoklamayiGoster();
  kasayiGuncelle();
});

// ---- Sayfa açılınca ----
yoklamayiGoster();
