// lab-terminal : backend terminal maison pour Lab Cyber.
// Protocole binaire WebSocket : 0 = output PTY, 0x30 = input, 0x31 = resize (JSON columns/rows).
// Compatible avec le client platform/public/terminal-client.html (xterm.js).

package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

const (
	msgOutput = 0
	msgInput  = 0x30
	msgResize = 0x31
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type resizeMsg struct {
	Columns int `json:"columns"`
	Rows    int `json:"rows"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7682"
	}
	http.HandleFunc("/ws", handleWS)
	http.HandleFunc("/token", handleToken) // compat ttyd : retourne un token factice pour que le client puisse se connecter
	log.Printf("lab-terminal listening on :%s (WS /ws, GET /token)", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleToken(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte("1"))
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade: %v", err)
		return
	}
	defer conn.Close()

	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/bash"
	}
	cmd := exec.Command(shell)
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")
	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Printf("pty start: %v", err)
		return
	}
	defer func() {
		ptmx.Close()
		cmd.Process.Kill()
	}()

	var mu sync.Mutex
	writeWS := func(msgType int, data []byte) error {
		mu.Lock()
		defer mu.Unlock()
		buf := make([]byte, 1+len(data))
		buf[0] = byte(msgType)
		copy(buf[1:], data)
		return conn.WriteMessage(websocket.BinaryMessage, buf)
	}

	// PTY -> WebSocket ; à la fermeture du PTY (ex. exit), on ferme la connexion pour que le client envoie postMessage
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if err != nil {
				if err != io.EOF {
					log.Printf("pty read: %v", err)
				}
				conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
				conn.Close()
				return
			}
			if n == 0 {
				continue
			}
			if err := writeWS(msgOutput, buf[:n]); err != nil {
				return
			}
		}
	}()

	// WebSocket -> PTY (ou resize)
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if len(data) == 0 {
			continue
		}
		switch data[0] {
		case msgInput:
			if _, err := ptmx.Write(data[1:]); err != nil {
				log.Printf("pty write: %v", err)
				return
			}
		case msgResize:
			var sz resizeMsg
			if json.Unmarshal(data[1:], &sz) != nil {
				continue
			}
			if sz.Rows > 0 && sz.Columns > 0 {
				pty.Setsize(ptmx, &pty.Winsize{
					Rows: uint16(sz.Rows),
					Cols: uint16(sz.Columns),
				})
			}
		}
	}
}
