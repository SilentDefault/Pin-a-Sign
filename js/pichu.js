//principal functions
'use strict';
var pos = null;
var server = 'http://mask.odacode.com';
var dbAble = 'indexedDB' in window;
var dbPromise = idb.open('PaS', 1, function (upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('Signs')) {
        upgradeDb.createObjectStore('Signs', { keyPath: "ID", autoIncrement: true });
    }
});
///
const radians = (deg) => deg * (Math.PI / 180);
function getDistanceFromLatLonInKm(lat, lon) {
    const RADIUS = 6371;
    return RADIUS * Math.acos(
        Math.sin(radians(lat)) *
        Math.sin(radians(pos.latitude)) +
        Math.cos(radians(lon - pos.longitude)) *
        Math.cos(radians(lat)) *
        Math.cos(radians(pos.latitude))
    ); //return diference in km
}
///
var frases = [
    "El(la) nunca volverá :'c", //0
    "El tamaño del mensaje depende de hace cuanto fue puesto el letrero", //1
    "Intenta no hacer spam, porfavor :)", //2
    "Toda persona que use esta app es ahora un Signaler", //3
    "Ve y descubre las señales puestas por otros Signalers, con precaucion", //4
    "Esto es una Beta, por ahora ;)", //5
    "Si te falla la app, puedes enviarme un mensaje~", //6
    "Los Signaler's Tips cambian junto con la actualizacion de los datos GPS", //7
    "Inteligente, no? ;)", //8
    "Im fine :')"
];
function sw() {//serviceworker register
    if ('serviceWorker' in navigator) {
        //Register the ServiceWorker
        navigator.serviceWorker.register('./sw.js').then(function (reg) {
            console.log('Successfully registered service worker', reg);
        }).catch(function (err) {
            console.warn('Error whilst registering service worker', err);
        });
    }
}

function createSign() {//create sign
    // if (navigator.onLine) {
    //     $.ajax({
    //         url: server + '/pas.asmx/AddSign',
    //         type: 'POST',
    //         dataType: "json",
    //         contentType: "application/json",
    //         data: JSON.stringify({
    //             s: {
    //                 Contenido: $('textarea').val(),
    //                 Latitud: pos.lat,
    //                 Longitud: pos.lon
    //             }
    //         }),
    //     })
    //         .done(function (data) {
    //             if (data.d == 1) {
    //                 localStorage.setItem('Counter', Number(localStorage.getItem('Counter')) + 1);
    //                 $('textarea').val('');
    //                 $('textarea').keyup();
    //                 alert('Pinned!');
    //             }
    //         });
    // }
    dbPromise.then(db => {
        const tx = db.transaction('Signs', 'readwrite');
        tx.objectStore('Signs').put({
            content: $('textarea').val(),
            date: +new Date(),
            latitude: pos.latitude,
            longitude: pos.longitude
        });
        return tx.complete;
    }).then(() => {
        $('textarea').val('').keyup();
    });

}

function renderPost(p) {
    $('signs').empty();
    $.each(p, function (i, p) {
        if (getDistanceFromLatLonInKm(p.latitude, p.longitude) < 1) {
            let d = new Date(p.date);
            $('signs').append(`
                <sign d${p.ID}>
                    <content d${Math.ceil((Math.abs(+Date() - p.date)) / (1000 * 3600 * 24))}>${p.content}</content>
                    <date>${d.getUTCDate()}/${d.getMonth()}/${d.getUTCFullYear()}</date>
                </sign>
            `);
        }
    });
}

function loadSigns() { //load signs
    // if (navigator.onLine) {
    //     $.ajax({
    //         url: server + '/pas.asmx/LoadSign',
    //         type: 'POST',
    //         dataType: "json",
    //         contentType: "application/json",
    //         data: JSON.stringify({
    //             Lat: pos.lat,
    //             Lon: pos.lon
    //         }),
    //     })
    //         .done(function (data) {
    //             $('[signs]').empty();
    //             data = data.d;
    //             $.each(data, function (i, v) {
    //                 renderPost(v);
    //             });
    //         });
    // } else {
    dbPromise.then(db => {
        return db.transaction('Signs')
            .objectStore('Signs').getAll();
    }).then(v => renderPost(v));
    //}
}

function eleResize() {//resize signs container
    $('signs').height($(window).height() - ($('editor').height() + (navigator.onLine ? 0 : $('offline').height())));
}

function txtArea() {//textarea functionability
    var $this = $('textarea');

    if ($this.val().length >= 255) {
        $this.val($this.val().substring(0, 255));
    }
    if ($('textarea').val() != '') {
        $('button').removeAttr('disabled');
        $('label').removeAttr('hidden');
        $('label').text($('textarea').val().length + '/255');
        if ($('textarea').val().length == 255) {
            $('label').css('color', 'red');
        } else {
            $('label').css('color', 'GrayText');
        }
    } else {
        $('button').attr('disabled', '');
        $('label').attr('hidden', '');
    }
}

$(document).ready(function () {
    sw();
    eleResize();
    $('textarea').keyup(function () { txtArea(); });
    if (navigator.onLine) {
        workOnLine();
    } else {
        workOffLine();
    }
});

$(window).resize(function () {
    eleResize();
});

function success(position) {
    pos = position.coords;
    $('textarea').attr('placeholder', `Lat: ${pos.latitude}
Lon: ${pos.longitude}
Signaler's Tips:
"${frases[Math.floor(Math.random() * (frases.length - 0) + 0)]}"`);
    loadSigns();
};

function error(err) {
    console.log(err);
    $('textarea').attr('placeholder', `Lat: -error-
Lon: -error-`);
};

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(success, error, { timeout: 15000, enableHighAccuracy: true });
}
else {
    $('textarea').attr('placeholder', `Tu navegador o dispositivo no soporta la geolocalizacion`);
}

function workOnLine() {
    $('offline').css('z-index', '-1');
    $('textarea').removeAttr('disabled').keyup();
    eleResize();
}

function workOffLine() {
    if (!dbAble) {
        $('offline')
            .css('background-color', 'red')
            .css('color', 'white')
            .text('Modo offline no compatible.');
        $('textarea').attr('disabled', '');
        $('button').attr('disabled', '');
    }
    $('offline').css('z-index', '1');
    $('signs').height($(document).height() - ($('editor').height() + $('offline').height()));
    $('offline').css('bottom', $('editor').height() + 'px');
}

window.addEventListener('online', function (e) { workOnLine(); }, false);

window.addEventListener('offline', function (e) { workOffLine(); }, false);