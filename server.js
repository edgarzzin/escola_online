const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bcrypt = require('bcrypt'); // Para hashing
const axios = require('axios');
const cookieParser = require('cookie-parser');
const saltRounds = 10; 

const app = express();
const port = 3000;

const openaiApiKey = 'your_api';

const db = new sqlite3.Database('./my-database.db', (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      birth_date TEXT,
      school_year INTEGER,
      rua TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,
      cep TEXT,
      profile_pic TEXT
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar a tabela:', err.message);
      } else {
        console.log('Tabela de usuários criada/verificada com sucesso.');
      }
    });
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());

app.get('/login', (req, res) => {
  if (req.cookies.session) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/cadastro', (req, res) => {
  console.log('Cookie de sessão:', req.cookies.session);
  if (req.cookies.session) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'cadastro.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'in.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.cookies.session) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.post('/signup', (req, res) => {
  const { name, email, password, confirm_password, birth_date, school_year } = req.body;

  if (!name || !email || !password || !confirm_password || !birth_date || !school_year) {
    return res.status(400).send('Todos os campos são obrigatórios.');
  }

  if (password !== confirm_password) {
    return res.status(400).send('As senhas não coincidem.');
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error('Erro ao consultar o banco de dados:', err.message);
      return res.status(500).send('Erro ao consultar o banco de dados.');
    }
    if (row) {
      return res.status(400).send('E-mail já registrado.');
    }

    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error('Erro ao criptografar a senha:', err.message);
        return res.status(500).send('Erro ao criptografar a senha.');
      }

      const newUser = {
        name,
        email,
        password: hashedPassword,
        birth_date,
        school_year
      };

      db.run("INSERT INTO users (name, email, password, birth_date, school_year) VALUES (?, ?, ?, ?, ?)",
        [newUser.name, newUser.email, newUser.password, newUser.birth_date, newUser.school_year],
        function (err) {
          if (err) {
            console.error('Erro ao salvar o usuário:', err.message);
            return res.status(500).send('Erro ao salvar o usuário.');
          }
          res.status(200).send('Cadastro realizado com sucesso!'); // Cadastro bem-sucedido
        });
    });
  });
});

app.post('/enviar-mensagem', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);
  const instructions = [
    `Você é um professor de português profissional, muito amigável, educado e legal. Ao interagir com os alunos, seja moderadamente irônico em alguns momentos para tornar a aula mais leve e divertida, mas sempre de forma sutil. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, mantendo as respostas curtas e objetivas.`
  ];  
  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });
    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-mate', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);
  const instructions = [
    `Você é um professor de matemática profissional, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  
  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });
    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-cien', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);
  const instructions = [
    `Você é um professor de Ciências, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-hist', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);

  const instructions = [
    `Você é um professor de História, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-geog', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);

  const instructions = [
    `Você é um professor de Geografia, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-lit', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);

  const instructions = [
    `Você é um professor de Literatura Classicas, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-artes', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);

  const instructions = [
    `Você é um professor de Artes e Culturas, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-edf', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);

  const instructions = [
    `Você é um professor de Educação Física, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-progr', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);

  const instructions = [
    `Você é um professor de Programação, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/enviar-mensagem-dire', async (req, res) => {
  const { message, subtopic } = req.body; 
  console.log(`Mensagem do usuário: ${message}, Subtópico: ${subtopic}`);

  const instructions = [
    `Você é um professor de Programação, muito amigável, educado e divertido. Ao interagir com os alunos, faça uso de uma abordagem prática e incentivadora. Seja moderadamente irônico em alguns momentos para tornar a aula mais leve, mas sempre de forma sutil e respeitosa. Assim que o aluno disser "olá", comece a passar as tarefas para avaliação relacionadas ao subtópico: ${subtopic}. Não utilize símbolos como ## ** em suas mensagens; destaque textos apenas com aspas. Responda de forma clara e direta, focando na resolução de problemas de forma objetiva e prática, com respostas curtas e esclarecedoras.`
  ];  

  const systemMessages = instructions.map(instruction => ({ role: "system", content: instruction }));
  const messages = [...systemMessages, { role: "user", content: message }];

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.4,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });

    const iaMessage = response.data.choices[0].message.content;
    console.log(`Resposta da IA: ${iaMessage}`);
    res.json({ message: iaMessage });
  } catch (error) {
    console.error(`Erro ao chamar a API da OpenAI: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});
// Rota para login de usuários
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      return res.status(500).send('Erro ao consultar o banco de dados.');
    }
    if (!row) {
      return res.status(400).send('Usuário não encontrado.');
    }

    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        return res.status(500).send('Erro ao comparar senhas.');
      }
      if (result) {
        // Cria um cookie de sessão
        res.cookie('session', row.id, { httpOnly: true, maxAge: 3600000 }); // 1 hora de duração
        res.redirect('/dashboard'); // Redireciona para o dashboard
      } else {
        res.status(400).send('Senha incorreta.');
      }
    });
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.cookies.session + ext); 
  }
});

const upload = multer({ storage: storage });

// Rota para retornar o perfil do usuário
app.get('/getProfile', (req, res) => {
  if (!req.cookies.session) {
    return res.status(401).send('Usuário não autenticado');
  }

  const userId = req.cookies.session;

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) {
      return res.status(500).send('Erro ao consultar o banco de dados.');
    }
    if (!row) {
      return res.status(404).send('Usuário não encontrado.');
    }

    res.json({
      name: row.name,
      email: row.email,
      rua: row.rua,
      bairro: row.bairro,
      cidade: row.cidade,
      estado: row.estado,
      cep: row.cep,
      profile_pic: row.profile_pic || 'https://placehold.co/50x50'
    });
  });
});

app.post('/updateProfile', upload.single('profile_pic'), (req, res) => {
  if (!req.cookies.session) {
    return res.status(401).send('Usuário não autenticado');
  }

  const userId = req.cookies.session;
  const { name, rua, bairro, cidade, estado, cep } = req.body;
  const profilePicPath = req.file ? `/uploads/${req.file.filename}` : null;

  db.run("UPDATE users SET name = ?, rua = ?, bairro = ?, cidade = ?, estado = ?, cep = ?, profile_pic = ? WHERE id = ?",
    [name, rua, bairro, cidade, estado, cep, profilePicPath, userId],
    function (err) {
      if (err) {
        console.error('Erro ao atualizar o perfil:', err.message);
        return res.status(500).send('Erro ao atualizar o perfil.');
      }
      res.json({ profile_pic: profilePicPath });
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const publicDirectoryPath = path.join(__dirname);
app.use(express.static(publicDirectoryPath));

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
