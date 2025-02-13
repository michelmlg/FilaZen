<?php

class Queue {
    private array $queue = [];

    public function enqueue(array $userData): void {
        $this->queue[] = $userData; // Adiciona o usuário ao final da fila
    }

    public function dequeue(): ?array {
        if ($this->isEmpty()) {
            return null;
        }
        
        return array_shift($this->queue); // Remove e retorna o primeiro usuário da fila
    }

    public function peek(): ?array {
        return $this->isEmpty() ? null : $this->queue[0]; // Retorna o primeiro da fila sem remover
    }

    public function isEmpty(): bool {
        return empty($this->queue);
    }

    public function size(): int {
        return count($this->queue);
    }

    public function getQueue(): array {
        return $this->queue;
    }

}
