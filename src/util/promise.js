const emptyPromise = () => Promise.resolve()

const promise = (callback, context, timeout, opts = {}) => {
    if (timeout) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(callback.call(context, opts))
            }, timeout)
        })
    }
    
    return Promise.resolve(callback.call(context, opts))
}

export {
    promise,
    emptyPromise,
}