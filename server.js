const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

app.use(cors());

const createUploadDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório ${dir} criado automaticamente.`);
  }
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(
      new Error("Tipo de arquivo inválido. Apenas JPG e PNG são permitidos."),
      false
    );
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDiretorio = "uploads/";
    createUploadDirectory(uploadDiretorio);
    cb(null, uploadDiretorio);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
});

app.post("/upload", (req, res) => {
  upload.array("meusArquivos", 10)(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ message: "Too many files" });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: `Arquivo muito grande. O limite é ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB.`,
        });
      }
      return res
        .status(400)
        .json({ message: `Erro do Multer: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    res.status(200).json({
      message: `${req.files.length} arquivos enviados com sucesso!`,
      fileCount: req.files.length,
    });
  });
});

app.get("/", (req, res) => {
  res.send("Servidor de upload funcionando");
});

app.listen(port, () => {
  console.log(`Servidor esta rodando na porta: ${port}`);
});
