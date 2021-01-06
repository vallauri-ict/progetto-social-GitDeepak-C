# Facegram 
#### Autore: Chopra Deepak - Mollo Niccolò

## Img Esempio
![imgFigurativa](img/imgEsempio.PNG)

## Funzionamento
La pagina è strutturata nel seguente modo:
- navbar, che contiene il logo e alcuni button per le operazioni:
    il logo e il pulsante home ricaricano sempilcemente la pagina, mentre contact me porta a una pagina statica di contatto, e infine abbiamo il pulsante Login, per appunto, loggarsi
- header, con un logo e una sezione filtri contenente dei radio button, al change dei quale si aggiornano i dati
- sezione delle proprietà (a sinistra), in cui al caricamento della pagina vengono caricati e stampati i dati presi dal databse
- sezione mappa (a destra), non finita a causa dei problemi con Google maps api, però lo scopo era quello di visualizzare per ogni proprietà un segnaposto e al click avere una piccola descrizione(come il progetto geolocation fatto in terza)
- footer, con una breve descrizione  

### Registrazione nuovo utente
Per la registrazione, nella pagina di login, abbiamo sotto al button di sumbit un link alla pagina di registrazione. Dopo la registrazione, se è andato tutto a buon fine, l'utente viene riportato alla pagina di login per accedere con i nuovi dati(ho preferito questo modo così da verificare effettivamente che il database sia stato aggioranato).
![imgFigurativa](images/imgSignUp.PNG)

## Database
Il database ha 3 tabelle:
- utenti, contenente i dati degli utenti 
- post, contenente i post per i vari utenti
- messaggi, usato per lo storico dei messaggi

### Struttura cartella
Per ciascun tipo di file abbiamo una cartella specifica:
- css -> per i file .css
- database -> contiene il database
- fonts -> contiene i fonts utilizzati per l'intera applicazione
- images -> contiene le foto utilizzate
- js -> per i file .js
- pagine -> contiene le altre pagine .html
- php -> per i file .php
- vendor -> cartella che contiene tutte le librerie neccesarie

## Bug e problemi
- A volte l'applicazione non esegue correttamente le query di update(nessun errore però la tabella non viene aggiornata)

## Team sviluppatori:
> 5B Info - Vallauri Fossano Italy