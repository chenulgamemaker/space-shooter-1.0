import pygame
import random
import sys

# Initialize Pygame
pygame.init()

# Screen setup
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Space Shooter")

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 100, 255)
YELLOW = (255, 255, 0)

# Player
class Player:
    def __init__(self):
        self.width = 50
        self.height = 40
        self.x = WIDTH // 2 - self.width // 2
        self.y = HEIGHT - 80
        self.speed = 7
        self.color = BLUE
        self.health = 100
    
    def draw(self):
        # Draw player ship
        pygame.draw.polygon(screen, self.color, [
            (self.x + self.width // 2, self.y),  # Nose
            (self.x, self.y + self.height),      # Bottom left
            (self.x + self.width, self.y + self.height)  # Bottom right
        ])
        # Wings
        pygame.draw.rect(screen, self.color, (self.x - 10, self.y + 20, 70, 10))
    
    def move(self, keys):
        if keys[pygame.K_LEFT] and self.x > 0:
            self.x -= self.speed
        if keys[pygame.K_RIGHT] and self.x < WIDTH - self.width:
            self.x += self.speed
        if keys[pygame.K_UP] and self.y > HEIGHT // 2:
            self.y -= self.speed
        if keys[pygame.K_DOWN] and self.y < HEIGHT - self.height:
            self.y += self.speed

# Bullet
class Bullet:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 5
        self.height = 15
        self.speed = 10
        self.color = YELLOW
    
    def draw(self):
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
    
    def move(self):
        self.y -= self.speed
        return self.y < 0  # Return True if bullet is off screen

# Enemy
class Enemy:
    def __init__(self):
        self.width = 40
        self.height = 40
        self.x = random.randint(0, WIDTH - self.width)
        self.y = random.randint(-100, -40)
        self.speed = random.randint(2, 5)
        self.color = RED
    
    def draw(self):
        pygame.draw.rect(screen, self.color, (self.x, self.y, self.width, self.height))
        # Draw some details
        pygame.draw.rect(screen, WHITE, (self.x + 5, self.y + 5, self.width - 10, self.height - 10))
    
    def move(self):
        self.y += self.speed
        return self.y > HEIGHT  # Return True if enemy is off screen

# Game function
def game():
    player = Player()
    bullets = []
    enemies = []
    clock = pygame.time.Clock()
    score = 0
    enemy_spawn_timer = 0
    game_over = False
    
    font = pygame.font.Font(None, 36)
    
    while True:
        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and not game_over:
                    # Shoot bullet
                    bullets.append(Bullet(player.x + player.width // 2 - 2, player.y))
                if event.key == pygame.K_r and game_over:
                    # Restart game
                    return game()
        
        if not game_over:
            # Player movement
            keys = pygame.key.get_pressed()
            player.move(keys)
            
            # Spawn enemies
            enemy_spawn_timer += 1
            if enemy_spawn_timer >= 60:  # Spawn every 60 frames (1 second)
                enemies.append(Enemy())
                enemy_spawn_timer = 0
            
            # Move bullets
            for bullet in bullets[:]:
                if bullet.move():
                    bullets.remove(bullet)
            
            # Move enemies and check collisions
            for enemy in enemies[:]:
                if enemy.move():
                    enemies.remove(enemy)
                    continue
                
                # Check bullet-enemy collision
                for bullet in bullets[:]:
                    if (bullet.x < enemy.x + enemy.width and
                        bullet.x + bullet.width > enemy.x and
                        bullet.y < enemy.y + enemy.height and
                        bullet.y + bullet.height > enemy.y):
                        enemies.remove(enemy)
                        bullets.remove(bullet)
                        score += 10
                        break
                
                # Check player-enemy collision
                if (player.x < enemy.x + enemy.width and
                    player.x + player.width > enemy.x and
                    player.y < enemy.y + enemy.height and
                    player.y + player.height > enemy.y):
                    player.health -= 20
                    enemies.remove(enemy)
                    if player.health <= 0:
                        game_over = True
        
        # Drawing
        screen.fill(BLACK)
        
        # Draw stars (background)
        for i in range(100):
            x = random.randint(0, WIDTH)
            y = random.randint(0, HEIGHT)
            pygame.draw.circle(screen, WHITE, (x, y), 1)
        
        # Draw game objects
        player.draw()
        for bullet in bullets:
            bullet.draw()
        for enemy in enemies:
            enemy.draw()
        
        # Draw UI
        score_text = font.render(f"Score: {score}", True, WHITE)
        health_text = font.render(f"Health: {player.health}", True, GREEN)
        screen.blit(score_text, (10, 10))
        screen.blit(health_text, (10, 50))
        
        if game_over:
            game_over_text = font.render("GAME OVER! Press R to restart", True, RED)
            screen.blit(game_over_text, (WIDTH // 2 - 150, HEIGHT // 2))
        
        pygame.display.flip()
        clock.tick(60)

# Start the game
if __name__ == "__main__":
    game()
