/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (exclusive)
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}