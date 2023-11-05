const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const logDirectory = path.join(__dirname, 'logs');
const moment = require('moment-timezone');
const app = express();
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}
app.use(bodyParser.json());
moment.tz.setDefault('Asia/Shanghai');

const key = Buffer.from('key', 'hex');
const iv = Buffer.from('iv', 'hex');

function encryptData(data) {
  const cipher = crypto.createCipheriv('des-ede3-cbc', key, iv);
  cipher.setAutoPadding(true); // Enable PKCS5 padding
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function encryptData(data) {
  const dataString = JSON.stringify(data); // 将对象转换为JSON字符串
  const cipher = crypto.createCipheriv('des-ede3-cbc', key, iv);
  let encrypted = cipher.update(dataString, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decryptData(encryptedData) {
  const decipher = crypto.createDecipheriv('des-ede3-cbc', key, iv);
  decipher.setAutoPadding(true); // Enable PKCS5 padding
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


// 日志文件名格式化函数
function getLogFileName() {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return path.join(logDirectory, `${year}-${month}-${day}.log`);
}

// 日志记录函数
function logData(request, responseData) {
  const logFileName = getLogFileName();
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const requestStr = JSON.stringify(request.body);
  const logEntry = `${timestamp} - Request Data: ${requestStr}\nResponse Data: ${responseData}\n`;

  fs.appendFile(logFileName, logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}

app.post('/encrypt', (req, res) => {
  try {
    const inputData = req.body.data;
    if (!inputData) {
      res.status(400).send('Missing data in request.');
      return;
    }
    const encryptedData = encryptData(inputData);
    logData(req, encryptedData);
    res.send(encryptedData);
  } catch (error) {
    res.status(500).send('Encryption error: ' + error.message);
  }
});

app.post('/decrypt', (req, res) => {
  try {
    const encryptedData = req.body.data;
    if (!encryptedData) {
      res.status(400).send('Missing encrypted data in request.');
      return;
    }
    const decryptedData = decryptData(encryptedData);
    logData(req, decryptedData);
    res.send(decryptedData);
  } catch (error) {
    res.status(500).send('Decryption error: ' + error.message);
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
