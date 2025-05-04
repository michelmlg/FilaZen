<?php
namespace Filazen\Backend\models;
use PDO;
use PDOException;

class Client {
    private $id;
    private $cpf;
    private $name;
    private $email;
    private $observations;
    private $created_at;
    private $cellphone_numbers = [];

    public function __construct($id = null, $cpf = null, $name = null, $email = null, $observations = null, $created_at = null, $cellphone_numbers = []) {
        $this->id = $id;
        $this->cpf = $cpf;
        $this->name = $name;
        $this->email = $email;
        $this->observations = $observations;
        $this->created_at = $created_at;
        $this->cellphone_numbers = $cellphone_numbers;
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

    public function getObservations() {
        return $this->observations;
    }

    public function getCreatedAt() {
        return $this->created_at;
    }

    public function getCellphoneNumbers() {
        return $this->cellphone_numbers;
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
            $pdo->beginTransaction();
            
            $sql = "UPDATE client SET cpf = :cpf, name = :name, email = :email WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $this->id,
                ':cpf' => $this->cpf,
                ':name' => $this->name,
                ':email' => $this->email
            ]);

            if (!isset($this->cellphone_numbers) || !is_array($this->cellphone_numbers)) {
                throw new Exception("Números de telefone inválidos.");
            }

            $sql = "SELECT cn.number, cn.id FROM cellphone_numbers cn 
                    JOIN client_cellphone_numbers ccn ON cn.id = ccn.number_id
                    WHERE ccn.client_id = :client_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':client_id' => $this->id]);
            $currentNumbers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // verifica se o telefone não está na lista, caso sim, deleta
            foreach ($currentNumbers as $currentNumber) {
                if (!in_array($currentNumber['number'], $this->cellphone_numbers)) {
                    $sql = "DELETE FROM client_cellphone_numbers 
                            WHERE client_id = :client_id AND number_id = :number_id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([':client_id' => $this->id, ':number_id' => $currentNumber['id']]);

                    $sql = "DELETE FROM cellphone_numbers WHERE id = :number_id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([':number_id' => $currentNumber['id']]);
                }
            }

            // adiciona telefones novos a lista do usuário
            foreach ($this->cellphone_numbers as $number) {
                $sql = "SELECT cn.id FROM cellphone_numbers cn 
                        JOIN client_cellphone_numbers ccn ON cn.id = ccn.number_id
                        WHERE ccn.client_id = :client_id AND cn.number = :number";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':client_id' => $this->id, ':number' => $number]);
                $existingNumberId = $stmt->fetchColumn();

                if ($existingNumberId) {
                    $sql = "UPDATE cellphone_numbers SET number = :number WHERE id = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([':number' => $number, ':id' => $existingNumberId]);
                } else {
                
                    $sql = "INSERT INTO cellphone_numbers (number) VALUES (:number)";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([':number' => $number]);
                    $numberId = $pdo->lastInsertId();

                
                    $sql = "INSERT INTO client_cellphone_numbers (client_id, number_id) VALUES (:client_id, :number_id)";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([':client_id' => $this->id, ':number_id' => $numberId]);
                }
            }

  
            $pdo->commit();
            return true;
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new Exception("Erro ao atualizar cliente: " . $e->getMessage());
        }
    }

    // Function to update a single collumn in the client table
    public static function updateField(PDO $pdo, int $clientId, string $field, $value):bool {
        $sql = "UPDATE client SET $field = :value WHERE id = :id"; 
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            ':value' => $value,
            ':id' => $clientId
        ]);
    
    }


    // Buscar cliente por ID e seus números de telefone
    public static function findById($pdo, $id) {
        $sql = "SELECT * FROM client WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $clientData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$clientData) return null;

        // Buscar números de telefone do cliente
        $sql = "SELECT cn.id, cn.number FROM client_cellphone_numbers ccn 
                JOIN cellphone_numbers cn ON ccn.number_id = cn.id 
                WHERE ccn.client_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        $numbers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return new Client(
            $clientData['id'],
            $clientData['cpf'],
            $clientData['name'],
            $clientData['email'],
            $clientData['observations'],
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

    public function addObservations($pdo, $observations) {
        try {
            $sql = "UPDATE client SET observations = :observations WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            return $stmt->execute([
                ':id' => $this->id,
                ':observations' => $observations
            ]);
        } catch (PDOException $e) {
            return false;
        }
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

    // Remover número de telefone de um cliente
    public function removeCellphoneNumber($pdo, $number) {
        try {
            // Verificar se o número de telefone existe para o cliente
            $sql = "SELECT cn.id FROM cellphone_numbers cn 
                    JOIN client_cellphone_numbers ccn ON cn.id = ccn.number_id
                    WHERE ccn.client_id = :client_id AND cn.number = :number";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':client_id' => $this->id, ':number' => $number]);
            $numberId = $stmt->fetchColumn();

            if ($numberId) {
                // Remover a associação do número de telefone com o cliente
                $sql = "DELETE FROM client_cellphone_numbers WHERE client_id = :client_id AND number_id = :number_id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':client_id' => $this->id, ':number_id' => $numberId]);

                // Se o número não estiver mais associado a nenhum outro cliente, pode ser removido da tabela cellphone_numbers
                $sql = "SELECT COUNT(*) FROM client_cellphone_numbers WHERE number_id = :number_id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':number_id' => $numberId]);
                $count = $stmt->fetchColumn();

                if ($count == 0) {
                    // Remover o número de telefone da tabela cellphone_numbers
                    $sql = "DELETE FROM cellphone_numbers WHERE id = :number_id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([':number_id' => $numberId]);
                }

                return true;
            }

            // Número não encontrado
            return false;
        } catch (PDOException $e) {
            return false;
        }
    }

    public static function updateCellphoneNumber($pdo, $cellphoneId, $newNumber) {
        $sql = "UPDATE cellphone_numbers SET number = :number WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            ':number' => $newNumber,
            ':id' => $cellphoneId
        ]);
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

    // Listar todos os clientes com paginação e busca
    public static function getAllClientsList($pdo, $limit, $page, $search = null) {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT id, cpf, name, email, created_at, updated_at FROM client";
        $params = [];

        if (!empty($search)) {
            $sql .= " WHERE name LIKE :search OR email LIKE :search OR cpf LIKE :search";
            $params[':search'] = '%' . $search . '%';
        }

        $sql .= " LIMIT :limit OFFSET :offset";
        $params[':limit'] = (int) $limit;
        $params[':offset'] = (int) $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int) $offset, PDO::PARAM_INT);
    
        if (!empty($search)) {
            $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function countAllClients($pdo, $search = null) {
        $sql = "SELECT COUNT(*) as total FROM client";
        $params = [];

        if (!empty($search)) {
            $sql .= " WHERE name LIKE :search OR email LIKE :search OR cpf LIKE :search";
            $params[':search'] = '%' . $search . '%';
        }

        $stmt = $pdo->prepare($sql);

        if (!empty($search)) {
            $stmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }

        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'];
    }

    public static function getTotalPages($pdo, $limit, $search = null) {
        $totalClients = self::countAllClients($pdo, $search);
        return ceil($totalClients / $limit);
    }

    public function toAssociativeArray() {
        return [
            'id' => $this->id,
            'cpf' => $this->cpf,
            'name' => $this->name,
            'email' => $this->email,
            'observations' => $this->observations,
            'created_at' => $this->created_at,
            'cellphone_numbers' => $this->cellphone_numbers,
        ];
    }

   
}

?>
