// Patch the Notification object...
const handler = {
    construct(target, args) {
        fetch("http://127.0.0.1:5000/stream/twitter", {
            method: "post",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(args)
        })
        return new target(...args);
    }
};
const Proxied = new Proxy(Notification, handler);
window.Notification = Proxied;
console.log("TweetDeckInjector: Injected!");