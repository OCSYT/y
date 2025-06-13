export default function GetDomain() {
    if (
        window.location.hostname == "localhost" ||
        window.location.hostname == "127.0.0.1") {
        return "http://127.0.0.1:" + import.meta.env.VITE_SERVER_PORT || 8080;
    }
    else {
        let domain = import.meta.env.VITE_SERVER_URL + ':' + import.meta.env.VITE_SERVER_PORT || 8080;
        console.log('Domained Fetched: ' + domain)
        return domain; //replace with dotenv logic
    }
}