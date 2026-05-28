
# 🚗 FaculRide API

API desenvolvida para gerenciar caronas universitárias, com funcionalidades de cadastro de usuários, veículos, viagens, avaliações e controle de logs de acesso.

## 🧠 Tecnologias Utilizadas
- Node.js
- Express
- TypeScript
- Sequelize (ORM)
- PostgreSQL (Banco de Dados)
- Swagger (Documentação de API)
- JWT (Autenticação)
- Bcrypt (Criptografia de senhas)

---

## ⚙️ Instalação e Configuração

### ✅ Pré-requisitos
- Node.js instalado
- PostgreSQL instalado

### 🔧 Instalação dos pacotes
Execute no terminal:

```bash
npm install
```

---

## 🔑 Configuração do Banco de Dados

O projeto utiliza PostgreSQL. Crie um banco de dados no seu PostgreSQL, por exemplo:

```sql
CREATE DATABASE faculride;
```

---

## 📄 Arquivo `.env`

Crie um arquivo chamado **`.env`** na raiz do projeto com as seguintes configurações:

```
DB_HOST=localhost
DB_USER=seu_usuario_postgres
DB_PASSWORD=sua_senha_postgres
DB_DATABASE=faculride
DB_PORT=5432

JWT_SECRET=sua_chave_secreta
```

---

## 🔗 Rodando as migrations

Execute:

```bash
npx sequelize-cli db:migrate
```

> Isso irá criar todas as tabelas no banco de dados PostgreSQL.

---

## 🚀 Executando a API

```bash
npm run dev
```

A API estará disponível em:

```
http://localhost:3000/api
```

---

## 🧪 Testando a API

### ✔️ Arquivo HTTP para testes

O projeto possui um arquivo **`faculride.http`** (na pasta `/http`) que pode ser utilizado diretamente no **Visual Studio Code** com a extensão **REST Client** para testar todas as rotas da API.

Basta abrir o arquivo, substituir o token gerado após login e testar os endpoints.

---

### 📑 Documentação Swagger

A API conta com documentação interativa pelo Swagger, disponível em:

```
http://localhost:3000/api-docs
```

> Nela é possível visualizar todos os endpoints, modelos, parâmetros, respostas e testar as rotas diretamente pela interface.

---

## 📦 Funcionalidades da API

- 🔑 Autenticação (JWT)
- 👤 CRUD de Usuário
- 🚗 CRUD de Veículo
- 📅 CRUD de Viagem
- ⭐ CRUD de Avaliação
- 📝 Logs de Acesso automáticos (gerados a cada login)

---

## 📚 Observações para Avaliação

- O banco de dados utilizado é **PostgreSQL**.
- Todas as senhas são armazenadas de forma segura com hash utilizando **bcrypt**.
- A API possui segurança nas rotas utilizando **JWT**.
- As rotas estão documentadas tanto no Swagger quanto no arquivo **HTTP**.

---

## 👨‍🏫 Observações para o Professor

- ✔️ Execute `npm install` para instalar as dependências.
- ✔️ Configure corretamente o arquivo `.env`.
- ✔️ Execute `npx sequelize-cli db:migrate` para criar as tabelas no PostgreSQL.
- ✔️ Acesse o Swagger em [http://localhost:3000/api-docs](http://localhost:3000/api-docs) para testar e visualizar a documentação.
- ✔️ Utilize o arquivo **`faculride.http`** para testar diretamente as rotas no VSCode com o plugin **REST Client**.

---

## 💻 Desenvolvido por
Breno Jose Da Silva, 3011392413025  
Gabriel Ribeiro Correa, 3011392413032  
Herivelton Henrique Gonçalves, 3011392413011  
Wendel Augusto Lopes Vasco, 3011392413035  
Ryan Carlo Negretti Pereira, 3011392413028  



