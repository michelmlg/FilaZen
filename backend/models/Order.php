<?php

class Order {
    private $id;
    private $status_id;
    private $client_id;
    private $employee_id;
    private $description;
    private $estimated_value;
    private $discount;
    private $created_at;
    private $expected_delivery_date;
    private $notes;
    private $origin_id;
    private $updated_at;

    public function __construct($status_id, $client_id, $employee_id, $description, $origin_id, $estimated_value = 0.00, $discount = 0.00, $expected_delivery_date = null, $notes = null) {
        $this->status_id = $status_id;
        $this->client_id = $client_id;
        $this->employee_id = $employee_id;
        $this->description = $description;
        $this->origin_id = $origin_id;
        $this->estimated_value = $estimated_value;
        $this->discount = $discount;
        $this->expected_delivery_date = $expected_delivery_date;
        $this->notes = $notes;
        $this->created_at = date("Y-m-d H:i:s");
        $this->updated_at = date("Y-m-d H:i:s");
    }

    public function store($pdo) {
        try {
            $pdo->beginTransaction();
            $sql = "INSERT INTO orders (
                status_id, 
                client_id, 
                employee_id, 
                description, 
                origin_id, 
                estimated_value, 
                discount, 
                expected_delivery_date, 
                notes, 
                created_at, 
                updated_at
            ) VALUES (
                :status_id,
                :client_id,
                :employee_id,
                :description,
                :origin_id,
                :estimated_value,
                :discount,
                :expected_delivery_date,
                :notes,
                NOW(),
                NOW()
            )";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':status_id' => $this->status_id,
                ':client_id' => $this->client_id,
                ':employee_id' => $this->employee_id,
                ':description' => $this->description,
                ':origin_id' => $this->origin_id,
                ':estimated_value' => $this->estimated_value,
                ':discount' => $this->discount,
                ':expected_delivery_date' => $this->expected_delivery_date,
                ':notes' => $this->notes
            ]);

            $orderId = $pdo->lastInsertId();
            $pdo->commit();
            return $orderId;

        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    public static function getAllOrderStatuses($pdo) {
        $sql = "SELECT * FROM order_status ORDER BY id ASC";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getAllOrderOrigins($pdo) {
        $sql = "SELECT * FROM order_origin ORDER BY id ASC";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function update($pdo) {
        $sql = "UPDATE orders SET 
                    status_id = :status_id,
                    client_id = :client_id,
                    employee_id = :employee_id,
                    description = :description,
                    estimated_value = :estimated_value,
                    discount = :discount,
                    expected_delivery_date = :expected_delivery_date,
                    notes = :notes,
                    origin_id = :origin_id,
                    updated_at = NOW()
                WHERE id = :id";
    
        $stmt = $pdo->prepare($sql);
        
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':status_id', $this->status_id);
        $stmt->bindParam(':client_id', $this->client_id);
        $stmt->bindParam(':employee_id', $this->employee_id);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':estimated_value', $this->estimated_value);
        $stmt->bindParam(':discount', $this->discount);
        $stmt->bindParam(':expected_delivery_date', $this->expected_delivery_date);
        $stmt->bindParam(':notes', $this->notes);
        $stmt->bindParam(':origin_id', $this->origin_id);
    
        return $stmt->execute();
    }

    public static function delete($pdo, $id) {
        $sql = "DELETE FROM orders WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public static function findById($pdo, $id) {
        $sql = "SELECT * FROM orders WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public static function findByClientId($pdo, $client_id) {
        $sql = "SELECT * FROM orders WHERE client_id = :client_id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':client_id', $client_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function findByEmployeeId($pdo, $employee_id) {
        $sql = "SELECT * FROM orders WHERE employee_id = :employee_id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':employee_id', $employee_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function findByDescription($pdo, $description) {
        $sql = "SELECT * FROM orders WHERE description LIKE :description";
        $stmt = $pdo->prepare($sql);
        $searchTerm = "%{$description}%";
        $stmt->bindParam(':description', $searchTerm, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function getAllOrders($pdo) {
        $sql = "SELECT * FROM orders";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

?>