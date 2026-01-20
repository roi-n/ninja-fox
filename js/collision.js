// Collision Detection System
class CollisionDetector {
    static checkAABB(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static checkPlatformCollision(entity, platform) {
        const entityBottom = entity.y + entity.height;
        const entityPrevBottom = entity.y + entity.height - entity.vy * (1/60);
        const platformTop = platform.y;

        // Check if entity is falling and crosses platform top
        if (entity.vy >= 0 &&
            entityPrevBottom <= platformTop &&
            entityBottom >= platformTop &&
            entity.x + entity.width > platform.x &&
            entity.x < platform.x + platform.width) {
            return true;
        }
        return false;
    }

    static checkSolidCollision(entity, platform) {
        const rect1 = {
            x: entity.x,
            y: entity.y,
            width: entity.width,
            height: entity.height
        };
        const rect2 = {
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height
        };
        return this.checkAABB(rect1, rect2);
    }

    static resolveCollision(entity, platform) {
        // Push entity out of platform
        const overlapLeft = (entity.x + entity.width) - platform.x;
        const overlapRight = (platform.x + platform.width) - entity.x;
        const overlapTop = (entity.y + entity.height) - platform.y;
        const overlapBottom = (platform.y + platform.height) - entity.y;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop) {
            entity.y = platform.y - entity.height;
            entity.vy = 0;
            entity.grounded = true;
            return 'top';
        } else if (minOverlap === overlapBottom) {
            entity.y = platform.y + platform.height;
            entity.vy = 0;
            return 'bottom';
        } else if (minOverlap === overlapLeft) {
            entity.x = platform.x - entity.width;
            entity.vx = 0;
            return 'left';
        } else if (minOverlap === overlapRight) {
            entity.x = platform.x + platform.width;
            entity.vx = 0;
            return 'right';
        }
    }
}
