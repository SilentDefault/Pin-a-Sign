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
    if ('serviceWorker' in navigator) {
        //Register the ServiceWorker
        navigator.serviceWorker.register('./sw.js').then(function (reg) {
            console.log('Successfully registered service worker', reg);
        }).catch(function (err) {
            console.warn('Error whilst registering service worker', err);
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
    $('signs').height($(window).height() - ($('editor').height() + (navigator.onLine ? 0 : $('offline').height())));
}

function txtArea() {
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
    console.log($('textarea').height() + 'px');
    $('textarea').keyup(function () { txtArea(); });
    $('offline').click(function () {
        $('textarea').removeAttr('disabled')
    });
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


function workOnLine() {
    console.log("You are online");
    $('offline').css('z-index', '-1');
    $('textarea').removeAttr('disabled').keyup();
    eleResize();
}

function workOffLine() {
    console.log("You are offline");
    $('offline').css('z-index', '1');
    $('signs').height($(document).height() - ($('editor').height() + $('offline').height()));
    $('offline').css('bottom', $('editor').height() + 'px');
    $('textarea').attr('disabled', '');
    $('button').attr('disabled', '');
}

window.addEventListener('online', function (e) {
    workOnLine();
}, false);

window.addEventListener('offline', function (e) {
    workOffLine();
}, false);