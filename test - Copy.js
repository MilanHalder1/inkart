const express = require('express');

const axios = require('axios');
const { error } = require('node:console');
const app = express();


app.get('/btc-pricing', async (req, res) => {
    try {
        const {base="BTCUSD",quote="TRXUSD"}=req.query
        const pair=`${base}${quote}`
        const { data } = await axios.get(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
        const value = data.result;
        res.json({
            result: value
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
})
app.listen(8000,()=>{
    console.log('server ruuning')
})