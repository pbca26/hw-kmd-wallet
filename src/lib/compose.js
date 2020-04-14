const compose = (...fns) => fns.reduceRight((f, g) => (...args) => f(g(...args)));

module.exports = compose;