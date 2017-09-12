var pos = {
    latitude: 0, //25.9930588
    longitude: 0 //-98.0756871
};
var server = 'http://mask.odacode.com';
var frases = [
    "El(la) nunca volverá :'c", //0
    "El tamaño del mensaje depende de hace cuanto fue puesto el letrero", //1
    "Intenta no hacer spam, porfavor :)", //2
    "Toda persona que use esta app es ahora un Signaler", //3
    "Ve y descubre las señales puestas por otros Signalers, con precaucion", //4
    "Esto es una Beta, por ahora ;)", //5
    "Si te falla la app, puedes enviarme un mensaje~", //6
    "Los Signaler's Tips cambian aleatoriamente, junto con la actualizacion de los datos GPS", //7
    "Inteligente, no? ;)", //8
    "Im fine :')"
];
function sw() {//serviceworker register
    if (navigator.serviceWorker.controller) {
        console.log('[PWA Builder] active service worker found, no need to register')
    } else {
        //Register the ServiceWorker
        navigator.serviceWorker.register('sw.js', {
            scope: './'
        }).then(function (reg) {
            console.log('Service worker has been registered for scope:' + reg.scope);
        });
    }
}

function createSign() {
    $.ajax({
        url: server + '/pas.asmx/AddSign',
        type: 'POST',
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({
            s: {
                Contenido: $('textarea').val(),
                Latitud: pos.lat,
                Longitud: pos.lon
            }
        }),
    })
        .done(function (data) {
            if (data.d == 1) {
                localStorage.setItem('Counter', Number(localStorage.getItem('Counter')) + 1);
                $('textarea').val('');
                $('textarea').keyup();
                alert('Pinned!');
            }
        });
}

function loadSigns() {
    $.ajax({
        url: server + 'mask.odacode.com/pas.asmx/LoadSign',
        type: 'POST',
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify({
            Lat: pos.lat,
            Lon: pos.lon
        }),
    })
        .done(function (data) {
            $('[signs]').empty();
            data = data.d;
            $.each(data, function (i, v) {
                let tmp = 'h' + (moment().diff(moment(v.Fecha), 'days') + 1);
                $('[signs]').append(`
                    <sign>
                        <${tmp} content>${v.Contenido}</${tmp}>
                        <date>${moment(v.Fecha).format('MMMM DD YYYY, HH:mm')}</date>
                    </sign>
                `);
            });
        });
}

function eleResize() {
    $('signs').height($(document).height() - $('textarea').height());
}

function txtArea() {
    var $this = $('textarea');

    if ($this.val().length == 255) {
        $this.val($this.val().substring(0, 255));
    }
    if ($('textarea').val()!='') {
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
    $('textarea').keydown(function () {
        txtArea();
    });
});

$(window).resize(function () {
    eleResize();
});

function success(position) {
    pos.latitude = position.coords.latitude;
    pos.longitude = position.coords.longitude;
    $('textarea').attr('placeholder', `Lat: ${pos.latitude}
Lon: ${pos.longitude}
Signaler's Tips:
"${frases[Math.floor(Math.random() * (frases.length - 0) + 0)]}"`);
};

function error(err) {
    $('textarea').attr('placeholder', `Lat: -error-
Lon: -error-`);
};

navigator.geolocation.watchPosition(success, error, {
    timeout: 1000
});