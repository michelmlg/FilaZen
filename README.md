# FilaZen


# Setup do Projeto

Este repositório contém um projeto que utiliza **Docker** para configurar um ambiente de desenvolvimento com **PHP**, **MySQL** e **phpMyAdmin**. Siga os passos abaixo para configurar e rodar o projeto localmente.

## Primeiros Passos

#### 1. Clonando o Repositório

Primeiro, clone este repositório para sua máquina local:

```bash
git clone https://github.com/michelmlg/FilaZen.git
cd FilaZen
```

#### 2. Copiando o Arquivo .env.example
O arquivo .env.example contém todas as variáveis de ambiente necessárias para configurar o projeto. Para começar, copie esse arquivo para criar seu arquivo .env:

```bash
cp .env.example .env
```

#### 3. Configurando o Arquivo .env
Abra o arquivo .env e defina os valores das variáveis de ambiente com as informações do seu ambiente local. As variáveis são as seguintes:

```
MYSQL_ROOT_PASSWORD: A senha do usuário root do MySQL (exemplo: sua-senha-root).
MYSQL_DATABASE: O nome do banco de dados que será criado (exemplo: nome-do-seu-banco).
MYSQL_USER: O nome do usuário do MySQL (exemplo: nome-do-seu-usuario).
MYSQL_PASSWORD: A senha do usuário do MySQL (exemplo: senha-do-seu-usuario).
MYSQL_PORT: A porta do MySQL (normalmente é 3306).
PMA_HOST: O nome do container que roda o MySQL. Neste projeto, o valor será db.
```

Exemplo do arquivo .env:
```
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=mysqldb
MYSQL_USER=test
MYSQL_PASSWORD=test
MYSQL_PORT=3306
PMA_HOST=db
```

#### 4. Verificando Requisitos
Certifique-se de que o Docker ou Docker Desktop esteja instalado na sua máquina. Você pode verificar isso rodando o seguinte comando no terminal:

```bash
docker --version
```
Se o Docker estiver instalado corretamente, você verá a versão do Docker.

#### 5. Rodando os Containers com Docker Compose
Agora que o arquivo .env está configurado, o próximo passo é rodar os containers com o Docker Compose. Execute o seguinte comando dentro do diretório do projeto para iniciar o processo:

```bash
docker-compose up -d --build
```

O Docker Compose irá criar e iniciar os containers necessários para o seu ambiente de desenvolvimento.

#### 6. Acessando o Projeto
Depois de rodar o Docker Compose, você pode acessar a aplicação e os serviços locais através das seguintes URLs:

Aplicação web: http://localhost

Banco de dados MySQL: localhost:3306

Interface web do phpMyAdmin: http://localhost:9090

Use as credenciais configuradas no arquivo .env para acessar o phpMyAdmin.

#### 7. Pronto!
Agora o ambiente está configurado e pronto para ser utilizado. Se precisar de ajuda adicional, consulte a documentação ou abra uma issue no repositório.