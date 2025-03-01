<?php
class Client {
    private $id;
    private $cpf;
    private $name;
    private $email;
    private $created_at;
    private $cellphone_numbers = [];

    public function __construct($id = null, $cpf = null, $name = null, $email = null, $created_at = null, $cellphone_numbers = []) {
        $this->id = $id;
        $this->cpf = $cpf;
        $this->name = $name;
        $this->email = $email;
        $this->created_at = $created_at;
        $this->cellphone_numbers = $cellphone_numbers;
    }

    // Inserir um novo cliente e seus números de telefone
    public function store($pdo) {
        try {
            $pdo->beginTransaction();

            // Inserir cliente
            $sql = "INSERT INTO client (cpf, name, email) VALUES (:cpf, :name, :email)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':cpf' => $this->cpf,
                ':name' => $this->name,
                ':email' => $this->email
            ]);

            // ID do cliente inserido
            $this->id = $pdo->lastInsertId();

            // Inserir números de telefone
            foreach ($this->cellphone_numbers as $number) {
                $this->addCellphoneNumber($pdo, $number);
            }

            $pdo->commit();
            return true;
        } catch (PDOException $e) {
            $pdo->rollBack();
            return false;
        }
    }

    // Atualizar cliente
    public function update($pdo) {
        try {
            $sql = "UPDATE client SET cpf = :cpf, name = :name, email = :email WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            return $stmt->execute([
                ':id' => $this->id,
                ':cpf' => $this->cpf,
                ':name' => $this->name,
                ':email' => $this->email
            ]);
        } catch (PDOException $e) {
            return false;
        }
    }

    // Buscar cliente por ID e seus números de telefone
    public static function findById($pdo, $id) {
        $sql = "SELECT * FROM clients WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $clientData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$clientData) return null;

        // Buscar números de telefone do cliente
        $sql = "SELECT cn.number FROM client_cellphone_numbers ccn 
                JOIN cellphone_numbers cn ON ccn.number_id = cn.id 
                WHERE ccn.client_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $numbers = $stmt->fetchAll(PDO::FETCH_COLUMN);

        return new Client(
            $clientData['id'],
            $clientData['cpf'],
            $clientData['name'],
            $clientData['email'],
            $clientData['created_at'],
            $numbers
        );
    }

    public static function getAllPhoneNumbers($pdo, $id) {
        $sql = "SELECT cn.number FROM client_cellphone_numbers ccn 
                JOIN cellphone_numbers cn ON ccn.number_id = cn.id 
                WHERE ccn.client_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    // Adicionar número de telefone a um cliente
    public function addCellphoneNumber($pdo, $number) {
        try {
            // Verificar se o número já existe
            $sql = "SELECT id FROM cellphone_numbers WHERE number = :number";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':number' => $number]);
            $numberData = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$numberData) {
                // Se não existir, insere
                $sql = "INSERT INTO cellphone_numbers (number) VALUES (:number)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':number' => $number]);
                $numberId = $pdo->lastInsertId();
            } else {
                $numberId = $numberData['id'];
            }

            // Associar número ao cliente
            $sql = "INSERT INTO client_cellphone_numbers (client_id, number_id) VALUES (:client_id, :number_id)";
            $stmt = $pdo->prepare($sql);
            return $stmt->execute([
                ':client_id' => $this->id,
                ':number_id' => $numberId
            ]);
        } catch (PDOException $e) {
            return false;
        }
    }

    // Excluir cliente e seus números associados
    public static function delete($pdo, $id) {
        try {
            $pdo->beginTransaction();

            // Remover associações com telefones
            $sql = "DELETE FROM client_cellphone_numbers WHERE client_id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            // Remover cliente
            $sql = "DELETE FROM client WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $pdo->commit();
            return true;
        } catch (PDOException $e) {
            $pdo->rollBack();
            return false;
        }
    }

    // Listar todos os clientes
    public static function getAllClients($pdo) {
        $sql = "SELECT * FROM client";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Getters
    public function getId() {
        return $this->id;
    }

    public function getCpf() {
        return $this->cpf;
    }

    public function getName() {
        return $this->name;
    }

    public function getEmail() {
        return $this->email;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    public function getCellphoneNumbers() {
        return $this->cellphone_numbers;
    }
}

?>
