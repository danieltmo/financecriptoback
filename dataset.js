var express = require('express');
const fs = require('fs');
const https = require('https')

const app = express()
const port = 3000
const cors = require('cors')
const crypto = require('crypto');


const corsOptions = {
    origin: '*'
}

app.use(cors(corsOptions));
app.use(express.json());

app.get('/load/:id', function (req, res) {
    const id = req.params.id;
    fs.readFile(`${id}-data.txt`, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // console.log("Usuário novo, gerando novo arquivo para o usuário");
                // fs.writeFile(`${id}-data.txt`, JSON.stringify([]), () => { });
                res.send("{}");
            } else {
                res.status(501).send("Erro ao carregar arquivo")
            }

            return
        }
        res.send(data);
    })

});


app.post('/save/:id', function (req, res) {
    const body = req.body
    const id = req.params.id;
    res.set('Content-Type', 'text/plain');
    fs.writeFile(`${id}-data.txt`, JSON.stringify(body), (err) => {
        // throws an error, you could also catch it here
        if (err) {
            console.log(err)
            res.status(501).send("Erro ao salvar arquivo")
        } else {
            // success case, the file was saved
            res.send(JSON.stringify(body));
        }


    });

});

app.get('/wallet', function (req, res) {
    const timestamp = (new Date()).getTime();
    let queryParam = "timestamp=" + timestamp;
    let signature = crypto.createHmac('sha256', req.get("X-MBX-APIKEY-S")).update(queryParam).digest('hex'); // set the HMAC hash header
    queryParam = queryParam + "&signature=" + signature;
    const options = {
        hostname: 'api.binance.com',
        path: '/api/v3/account?' + queryParam,
        method: 'GET',
        headers: {
            'X-MBX-APIKEY': req.get("X-MBX-APIKEY")
        }
    }


    res.set('Content-Type', 'text/plain');

    let binanceRes = "";
    httpRequest(
        options,
        (d) => {
            binanceRes += d;
        },
        () => {
            res.send(binanceRes);
        },
        () => {
            res.status(501).send("Erro ao buscar wallet")
        }
    );


});

app.get('/trades', function (req, res) {
    const timestamp = (new Date()).getTime();
    let queryParam = "timestamp=" + timestamp + "&symbol=" + req.query.symbol + "&limit=1000";
    let signature = crypto.createHmac('sha256', req.get("X-MBX-APIKEY-S")).update(queryParam).digest('hex'); // set the HMAC hash header
    queryParam = queryParam + "&signature=" + signature;
    const options = {
        hostname: 'api.binance.com',
        path: '/api/v3/myTrades?' + queryParam,
        method: 'GET',
        headers: {
            'X-MBX-APIKEY': req.get("X-MBX-APIKEY")
        }
    }


    res.set('Content-Type', 'text/plain');

    let binanceRes = "";
    httpRequest(
        options,
        (d) => {
            binanceRes += d;
        },
        () => {
            res.send(binanceRes);
        },
        () => {
            res.status(501).send("Erro ao trades")
        }
    );

});


function httpRequest(options, onData, onEnd, onErro) {
    const request = https.request(options, binanceCallback => {
        binanceCallback.on('data', d => {
            onData(d);
        })
        binanceCallback.on('end', function () {
            onEnd()
        });
    })

    request.on('error', error => {
        onErro();
    })

    request.end()
}


app.post('/openaccountws', function (req, res) {
    const key = req.get("X-MBX-APIKEY")
    const options = {
        hostname: 'api.binance.com',
        path: '/api/v3/userDataStream',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-MBX-APIKEY': key
        }
    }
    res.set('Content-Type', 'text/plain');
    const request = https.request(options, binanceRes => {
        console.log(`statusCode: ${binanceRes.statusCode}`)

        binanceRes.on('data', d => {
            res.send(d);
        })
    })

    request.on('error', error => {
        console.error(error)
        res.status(501).send("Erro ao buscar key")
    })

    // request.write(data)
    request.end()

});


app.listen(port, () => {

})