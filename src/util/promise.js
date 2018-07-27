const emptyPromise = () => Promise.resolve()

const promise = (callback, context, args, timeout) => {
    if (timeout) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(callback.call(context, ...args))
            }, timeout)
        })
    }
    
    return Promise.resolve(callback.call(context, ...args))
}

export {
    promise,
    emptyPromise,
}