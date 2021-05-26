// Starter
import './style.css';

import { fromEvent, merge, Subject } from 'rxjs';
import { delay, finalize, tap } from 'rxjs/operators';
import { tapOnFirstEmit, fromWebSerial } from '@rxjs-ninja/rxjs-utility';
import { appendChatLine } from './utils';

/**
 * Set up out Event buttons
 */
const startButton = document.getElementById('start');
const sendButton = document.getElementById('send');
const endButton = document.getElementById('cancel');
// Emoji buttons append the Eomji to the text box
const emojiButtons = document.querySelectorAll('.emoji');
const controls = document.getElementById('controls');

// The output of all the messages
const output = document.getElementById('chat-output');

// The Text input from the browser user
const textInput = document.getElementById('chat-text') as HTMLInputElement;

// Const the info panels
const connectionInfo = document.getElementById('connection-info');
const appInfo = document.getElementById('app-info');
const appList = document.getElementById('app-list');

// Emitter for our message from the input
const sendMessage$ = new Subject<Uint8Array>();
const decoder = new TextDecoder('utf-8');
const encoder = new TextEncoder();
let endCtrl: AbortController;

/**
 * Method called from the below merge, if the text is empty
 * we don't sent anything,
 */
function sendMessageToListeners(event: Event) {
  if (textInput.value !== '') {
    appendChatLine(output, textInput.value, 'blue');
    sendMessage$.next(encoder.encode(`${textInput.value}\n`));
    textInput.value = null;
    textInput.focus();
  }
}

/**
 * Helper to check if the input is a enter key
 */
function isEnterKey(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent && event.code === 'Enter';
}

function isCtrlKey(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent && event.ctrlKey;
}

function endConnection(ctrl: AbortController) {
  ctrl.abort();
  startButton.style.display = 'inline';
  endButton.style.display = 'none';
  appendChatLine(output, 'Disconnected from Device');
}

async function startConnection() {
  endCtrl = new AbortController();
  const port = await navigator.serial.requestPort();

  /**
   * Pass out port, input and signal for ending the connection
   */
  fromWebSerial(port, sendMessage$.asObservable(), undefined, endCtrl.signal)
    .pipe(
      tapOnFirstEmit(() => {
        connectionInfo.style.display = 'none';
        appList.style.display = 'none';
        appInfo.style.display = 'block';
        endButton.style.display = 'inline';
        startButton.style.display = 'none';
        output.style.display = 'block';
        controls.style.display = 'block';
        appendChatLine(output, 'Connected to Serial Device');
        textInput.focus();
      }),
      tap(value => appendChatLine(output, decoder.decode(value))),
      delay(1000),
      finalize(() => {
        connectionInfo.style.display = 'block';
        appList.style.display = 'block';
        appInfo.style.display = 'none';
        output.style.display = 'none';
        controls.style.display = 'none';
      })
    )
    .subscribe();
}

/**
 * Set up and Event listener on the document and listen for control keys
 */
fromEvent(document, 'keydown')
  .pipe(
    tap(async () => {
      if (isCtrlKey(event)) {
        if (
          event.code === 'KeyC' &&
          (!endCtrl || (endCtrl && endCtrl.signal.aborted))
        ) {
          await startConnection();
        } else if (event.code === 'KeyD') {
          endConnection(endCtrl);
        } else if (event.code.includes('Digit')) {
          const num = parseInt(event.key);
          const value = emojiButtons[num].innerHTML;
          textInput.value += value;
        }
      }
    })
  )
  .subscribe();

/**
 * Merge the Observables for the send button click or the keydown event from the input, here we check if the user has clicked Enter
 */
merge(fromEvent(sendButton, 'click'), fromEvent(textInput, 'keydown'))
  .pipe(
    tap(event => {
      if (isEnterKey(event) || event instanceof MouseEvent) {
        sendMessageToListeners(event);
      }
    })
  )
  .subscribe();

/**
 * Set up our Emoji buttons to append to the text input
 */

fromEvent(emojiButtons, 'click')
  .pipe(
    tap(event => {
      const emoji = (event.currentTarget as any).innerHTML;
      textInput.value += emoji;
    })
  )
  .subscribe();

/**
 * Bind the end button to a single click to cancel the streams and update the UI
 */
fromEvent(endButton, 'click')
  .pipe(
    tap(() => {
      endConnection(endCtrl);
    })
  )
  .subscribe();

/**
 * When we click the start button we create a new instance of the Web Serial port and end controller, then create a new subscription to it
 */
fromEvent(startButton, 'click')
  .pipe(
    tap(async () => {
      try {
        await startConnection();
      } catch (e) {
        console.log('test:', e);
        // The prompt has been dismissed without selecting a device.
      }
    })
  )
  .subscribe();
