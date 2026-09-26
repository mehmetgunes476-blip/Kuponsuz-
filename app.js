// ---- Kayıtlı verileri yükle ----
let toplam = Number(localStorage.getItem("toplam")) || 0;
let kuponlar = JSON.parse(localStorage.getItem("kuponlar")) || [];
let secilenMaclar = [];

let hedef = JSON.parse(localStorage.getItem("hedef"));
let tamamlananHedefler = JSON.parse(localStorage.getItem("tamamlananHedefler")) || [];
let sonrakiBaslangic = Number(localStorage.getItem("sonrakiBaslangic")) || 0;

// ---- Sayfadaki öğeleri bul ----
const tutarYazisi = document.getElementById("tutar");
const netSonucYazisi = document.getElementById("netSonuc");

const hedefFormu = document.getElementById("hedefFormu");
const hedefIlerleme = document.getElementById("hedefIlerleme");
const hedefAdiKutusu = document.getElementById("hedefAdi");
const hedefTutariKutusu = document.getElementById("hedefTutari");
const hedefBaslik = document.getElementById("hedefBaslik");
const cubukDolgu = document.getElementById("cubukDolgu");
const hedefDurum = document.getElementById("hedefDurum");
const hedefMesaji = document.getElementById("hedefMesaji");
const rozetListesi = document.getElementById("rozetler");

const macKutusu = document.getElementById("mac");
const tahminKutusu = document.getElementById("tahmin");
const oranKutusu = document.getElementById("oran");
const macListesi = document.getElementById("macListesi");
const toplamOranYazisi = document.getElementById("toplamOran");
const miktarKutusu = document.getElementById("miktar");
const olasiKazancYazisi = document.getElementById("olasiKazanc");
const mesaj = document.getElementById("mesaj");
const kuponListesi = document.getElementById("kuponListesi");

// ---- Yardımcı fonksiyonlar ----
function paraYaz(sayi) {
  return sayi.toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " TL";
}

function mesajGoster(metin, hataMi) {
  mesaj.textContent = metin;
  mesaj.style.color = hataMi ? "#b3261e" : "#2e7d4f";
}

function toplamOranHesapla() {
  let oran = 1;
  for (const mac of secilenMaclar) {
    oran = oran * mac.oran;
  }
  return oran;
}

function kuponlariKaydet() {
  localStorage.setItem("kuponlar", JSON.stringify(kuponlar));
}

function hedefleriKaydet() {
  localStorage.setItem("hedef", JSON.stringify(hedef));
  localStorage.setItem("tamamlananHedefler", JSON.stringify(tamamlananHedefler));
  localStorage.setItem("sonrakiBaslangic", sonrakiBaslangic);
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

// ---- Kasa ----
function kasayiGuncelle() {
  tutarYazisi.textContent = paraYaz(toplam);
  hedefiGuncelle();

  const sonuc = netSonucHesapla();
  if (sonuc.sonuclanan === 0) {
    netSonucYazisi.textContent = "Henüz sonuçlanan kupon yok.";
  } else if (sonuc.net < 0) {
    netSonucYazisi.textContent = sonuc.sonuclanan + " kupon sonuçlandı. Hepsini oynasaydın net " + paraYaz(-sonuc.net) + " kaybedecektin.";
  } else {
    netSonucYazisi.textContent = sonuc.sonuclanan + " kupon sonuçlandı. Şimdilik net " + paraYaz(sonuc.net) + " öndesin, ama bu tablo uzun vadede nadiren böyle kalır.";
  }
}

// ---- Hedef ----
function rozetleriGoster() {
  rozetListesi.innerHTML = "";
  for (const tamamlanan of tamamlananHedefler) {
    const rozet = document.createElement("li");
    rozet.className = "rozet";
    rozet.textContent = "🏆 " + tamamlanan.ad + " — " + paraYaz(tamamlanan.tutar);
    rozetListesi.append(rozet);
  }
}

function hedefiGuncelle() {
  if (hedef === null) {
    hedefFormu.hidden = false;
    hedefIlerleme.hidden = true;
    return;
  }

  const biriken = toplam - hedef.baslangic;

  if (biriken >= hedef.tutar) {
    tamamlananHedefler.push({ ad: hedef.ad, tutar: hedef.tutar, tarih: new Date().toISOString() });
    sonrakiBaslangic = hedef.baslangic + hedef.tutar;
    hedefMesaji.textContent = "🎉 Tebrikler! Bahis oynamayarak " + hedef.ad.toLocaleLowerCase("tr-TR") + " parasını biriktirdin!";
    hedef = null;
    hedefleriKaydet();
    rozetleriGoster();
    hedefiGuncelle();
    return;
  }

  const yuzde = Math.min(100, (biriken / hedef.tutar) * 100);

  hedefFormu.hidden = true;
  hedefIlerleme.hidden = false;
  hedefBaslik.textContent = hedef.ad + " için biriktiriyorsun";
  cubukDolgu.style.width = yuzde + "%";
  hedefDurum.textContent = paraYaz(biriken) + " / " + paraYaz(hedef.tutar) + " · %" + Math.floor(yuzde);
}

// ---- Yeni kupon ----
function kazanciGuncelle() {
  const miktar = Number(miktarKutusu.value);
  if (secilenMaclar.length === 0 || miktar <= 0) {
    olasiKazancYazisi.textContent = "-";
    return;
  }
  olasiKazancYazisi.textContent = paraYaz(miktar * toplamOranHesapla());
}

function kuponuGoster() {
  macListesi.innerHTML = "";

  secilenMaclar.forEach(function (mac, sira) {
    const satir = document.createElement("li");

    const bilgi = document.createElement("span");
    bilgi.textContent = mac.mac + " — " + mac.tahmin + " (" + mac.oran.toFixed(2) + ")";

    const silButonu = document.createElement("button");
    silButonu.textContent = "✕";
    silButonu.className = "sil";
    silButonu.addEventListener("click", function () {
      secilenMaclar.splice(sira, 1);
      kuponuGoster();
    });

    satir.append(bilgi, silButonu);
    macListesi.append(satir);
  });

  if (secilenMaclar.length === 0) {
    toplamOranYazisi.textContent = "-";
  } else {
    toplamOranYazisi.textContent = toplamOranHesapla().toFixed(2);
  }
  kazanciGuncelle();
}

// ---- Kuponlarım ----
function sonuclandir(kupon, durum) {
  kupon.durum = durum;
  kuponlariKaydet();
  kuponlarimiGoster();
  kasayiGuncelle();
}

function kuponlarimiGoster() {
  kuponListesi.innerHTML = "";

  if (kuponlar.length === 0) {
    const bos = document.createElement("li");
    bos.className = "durum";
    bos.textContent = "Henüz kupon yok.";
    kuponListesi.append(bos);
    return;
  }

  // En yeni kupon en üstte görünsün diye listeyi sondan başa geziyoruz
  for (let i = kuponlar.length - 1; i >= 0; i--) {
    const kupon = kuponlar[i];
    const satir = document.createElement("li");
    satir.className = "kupon";

    const baslik = document.createElement("strong");
    const tarih = new Date(kupon.tarih).toLocaleDateString("tr-TR");
    baslik.textContent = tarih + " · " + kupon.maclar.length + " maç · " + paraYaz(kupon.miktar);

    const maclar = document.createElement("div");
    maclar.className = "kupon-maclar";
    maclar.textContent = kupon.maclar.map(m => m.mac + " (" + m.tahmin + ")").join(", ");

    satir.append(baslik, maclar);

    if (kupon.durum === "bekliyor") {
      const dugmeler = document.createElement("div");
      dugmeler.className = "kupon-dugmeler";

      const tuttuButonu = document.createElement("button");
      tuttuButonu.className = "buton ikincil kucuk";
      tuttuButonu.textContent = "Tuttu";
      tuttuButonu.addEventListener("click", function () {
        sonuclandir(kupon, "tuttu");
      });

      const yattiButonu = document.createElement("button");
      yattiButonu.className = "buton kucuk";
      yattiButonu.textContent = "Yattı";
      yattiButonu.addEventListener("click", function () {
        sonuclandir(kupon, "yatti");
      });

      dugmeler.append(tuttuButonu, yattiButonu);
      satir.append(dugmeler);
    } else {
      const durum = document.createElement("div");
      durum.className = "durum";
      durum.textContent = kupon.durum === "tuttu" ? "Sonuçlandı: tuttu" : "Sonuçlandı: yattı";
      satir.append(durum);
    }

    kuponListesi.append(satir);
  }
}

// ---- Düğmeler ----
document.getElementById("hedefKaydet").addEventListener("click", function () {
  const ad = hedefAdiKutusu.value.trim();
  const tutar = Number(hedefTutariKutusu.value);

  if (ad === "" || tutar <= 0) {
    hedefMesaji.textContent = "Hedefin adını ve tutarını gir.";
    return;
  }

  hedef = { ad: ad, tutar: tutar, baslangic: sonrakiBaslangic };
  hedefAdiKutusu.value = "";
  hedefTutariKutusu.value = "";
  hedefMesaji.textContent = "";
  hedefleriKaydet();
  hedefiGuncelle();
});

document.getElementById("hedefDegistir").addEventListener("click", function () {
  hedef = null;
  hedefleriKaydet();
  hedefiGuncelle();
});

document.getElementById("macEkle").addEventListener("click", function () {
  const macAdi = macKutusu.value.trim();
  const oran = Number(oranKutusu.value);

  if (macAdi === "" || oran <= 1) {
    mesajGoster("Maç adını ve 1'den büyük bir oran gir.", true);
    return;
  }

  secilenMaclar.push({ mac: macAdi, tahmin: tahminKutusu.value, oran: oran });
  macKutusu.value = "";
  oranKutusu.value = "";
  mesajGoster("", false);
  kuponuGoster();
});

miktarKutusu.addEventListener("input", kazanciGuncelle);

document.getElementById("onayla").addEventListener("click", function () {
  const miktar = Number(miktarKutusu.value);

  if (secilenMaclar.length === 0) {
    mesajGoster("Önce kupona en az bir maç ekle.", true);
    return;
  }
  if (miktar <= 0) {
    mesajGoster("Lütfen geçerli bir tutar gir.", true);
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

  kuponlariKaydet();
  localStorage.setItem("toplam", toplam);

  mesajGoster("Bu kuponu gerçekten oynasaydın " + paraYaz(miktar) + " cebinden çıkacaktı. O para artık kasanda.", false);

  secilenMaclar = [];
  miktarKutusu.value = "";
  kuponuGoster();
  kasayiGuncelle();
  kuponlarimiGoster();
});

// ---- Sayfa açılınca ----
rozetleriGoster();
kasayiGuncelle();
kuponlarimiGoster();