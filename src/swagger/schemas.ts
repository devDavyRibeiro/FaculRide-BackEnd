export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "FaculRide API",
    description: "Documentação da API FaculRide",
    version: "1.0.0",
  },
  servers: [
    {
      url: process.env.BASE_URL || "http://localhost:3000/api",
      description: "Servidor API",
    },
  ],
  components: {
    schemas: {
      Usuario: {
        type: "object",
        properties: {
          idUsuario: { type: "integer" },
          nome: { type: "string" },
          cpf: { type: "string" },
          email: { type: "string" },
          senha: { type: "string" },
          telefone: { type: "string" },
          cep: { type: "string" },
          endereco: { type: "string" },
          numero: { type: "string" },
          cidade: { type: "string" },
          estado: { type: "string" },
          fatec: { type: "string" },
          ra: { type: "string" },
          genero: { type: "boolean" },
          dataNascimento: { type: "string", format: "date" },
          tipoUsuario: { type: "string", enum: ["passageiro", "motorista"] },
        },
        required: ["nome", "email", "senha", "tipoUsuario", "dataNascimento"],
      },

      UserFileUpload: {
        type: "object",
        required: ["file"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description:
              "Arquivo do usuário (foto  de perfil png, jpg, jpeg ou webp)",
          },
        },
      },

      Veiculo: {
        type: "object",
        properties: {
          ID_veiculo: { type: "integer" },
          Placa_veiculo: { type: "string" },
          Cor: { type: "string" },
          Modelo: { type: "string" },
          Ano: { type: "integer" },
          idUsuario: { type: "integer" },
        },
        required: ["Modelo", "Cor", "idUsuario"],
      },

      Viagem: {
        type: "object",
        properties: {
          idViagem: { type: "integer" },
          tipoUsuario: { type: "string", enum: ["motorista", "passageiro"] },
          partida: { type: "string" },
          destino: { type: "string" },
          horarioEntrada: { type: "string" },
          horarioSaida: { type: "string" },
          ajudaDeCusto: { type: "string" },
          idUsuario: { type: "integer" },
        },
        required: [
          "tipoUsuario",
          "partida",
          "destino",
          "horarioEntrada",
          "horarioSaida",
          "ajudaDeCusto",
          "idUsuario",
        ],
      },

      Avaliacao: {
        type: "object",
        properties: {
          ID_Avaliacao: { type: "integer" },
          ID_Avaliador: { type: "integer" },
          ID_Avaliado: { type: "integer" },
          Comentario: { type: "string" },
          Estrelas: { type: "integer", minimum: 1, maximum: 5 },
        },
        required: ["ID_Avaliador", "ID_Avaliado", "Comentario", "Estrelas"],
      },

      LogAcesso: {
        type: "object",
        properties: {
          idLog: { type: "integer" },
          idUsuario: { type: "integer" },
          dataHora: { type: "string", format: "date-time" },
          descricao: { type: "string" },
        },
        required: ["idUsuario", "dataHora", "descricao"],
      },

      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string" },
          senha: { type: "string" },
        },
        required: ["email", "senha"],
      },

      LoginResponse: {
        type: "object",
        properties: {
          mensagem: { type: "string" },
          token: { type: "string" },
          usuario: { $ref: "#/components/schemas/Usuario" },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },

  security: [{ bearerAuth: [] }],

  paths: {
    // 🔑 LOGIN
    "/usuario/login": {
      post: {
        summary: "Login do usuário",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login realizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: { description: "Credenciais inválidas" },
        },
      },
    },

    // Usuário
    "/usuario": {
      get: {
        summary: "Listar usuários ou filtrar",
        tags: ["Usuário"],
        responses: {
          200: {
            description: "Lista de usuários",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Usuario" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Cadastrar um novo usuário",
        tags: ["Usuário"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Usuario" },
            },
          },
        },
        responses: {
          201: { description: "Usuário cadastrado" },
        },
      },
    },

    "/usuario/{id}": {
      get: {
        summary: "Buscar usuário por ID",
        tags: ["Usuário"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Usuário encontrado" },
          404: { description: "Usuário não encontrado" },
        },
      },
      put: {
        summary: "Atualizar usuário",
        tags: ["Usuário"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Usuario" },
            },
          },
        },
        responses: {
          200: { description: "Usuário atualizado" },
        },
      },
      delete: {
        summary: "Deletar usuário",
        tags: ["Usuário"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: { description: "Usuário deletado" },
        },
      },
    },

    "/usuario/foto/upload": {
      post: {
        summary: "Upload de arquivo do usuário autenticado",
        description:
          "Upload de arquivo associado ao usuário identificado via JWT",
        tags: ["Usuário"],
        security: [{ bearerAuth: [] }],

        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/UserFileUpload",
              },
            },
          },
        },

        responses: {
          201: { description: "Arquivo enviado com sucesso" },
          400: { description: "Arquivo inválido ou não enviado" },
          401: { description: "Token inválido ou não informado" },
        },
      },
    },

    // Veículo
    "/veiculo": {
      get: {
        summary: "Listar veículos",
        tags: ["Veículo"],
        responses: {
          200: {
            description: "Lista de veículos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Veiculo" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Cadastrar veículo",
        tags: ["Veículo"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Veiculo" },
            },
          },
        },
        responses: {
          201: { description: "Veículo cadastrado" },
        },
      },
    },

    // Viagem
    "/viagem": {
      get: {
        summary: "Listar viagens",
        tags: ["Viagem"],
        responses: {
          200: {
            description: "Lista de viagens",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Viagem" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Cadastrar viagem",
        tags: ["Viagem"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Viagem" },
            },
          },
        },
        responses: {
          201: { description: "Viagem cadastrada" },
        },
      },
    },

    // Avaliação
    "/avaliacao": {
      get: {
        summary: "Listar avaliações",
        tags: ["Avaliação"],
        responses: {
          200: {
            description: "Lista de avaliações",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Avaliacao" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Cadastrar avaliação",
        tags: ["Avaliação"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Avaliacao" },
            },
          },
        },
        responses: {
          201: { description: "Avaliação cadastrada" },
        },
      },
    },

    // Log de Acesso
    "/logacesso": {
      get: {
        summary: "Listar logs de acesso",
        tags: ["LogAcesso"],
        responses: {
          200: {
            description: "Lista de logs",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/LogAcesso" },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Cadastrar log de acesso",
        tags: ["LogAcesso"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LogAcesso" },
            },
          },
        },
        responses: {
          201: { description: "Log cadastrado" },
        },
      },
    },
  },
};
