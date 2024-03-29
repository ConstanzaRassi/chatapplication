import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const handleSend = async () => {
    //
    if (img) {
      const storageRef = ref(storage, uuid());
      const uploadTask = uploadBytesResumable(storageRef, img);
      uploadTask.on(
        (error) => {
          //TODO:Handle Error
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            await updateDoc(doc(db, "chats", data.chatId), {
              messages: arrayUnion({
                id: uuid(),
                text,
                senderId: currentUser.uid,
                date: Timestamp.now(),
                img: downloadURL,
              }),
            });
            setText("");
          });
        }
      );
    } else {
      if (text.trim() === "") {
        // Verificar si el texto está vacío o contiene solo espacios en blanco
        return; // Salir de la función sin hacer nada
      } else if (text != null) {
        await updateDoc(doc(db, "chats", data.chatId), {
          messages: arrayUnion({
            id: uuid(),
            text,
            senderId: currentUser.uid,
            date: Timestamp.now(),
          }),
        });
        setText("");
      }
    }

    await updateDoc(doc(db, "userChats", currentUser.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
        senderId: currentUser.uid,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    await updateDoc(doc(db, "userChats", data.user.uid), {
      [data.chatId + ".lastMessage"]: {
        text,
        senderId: data.user.uid,
      },
      [data.chatId + ".date"]: serverTimestamp(),
    });

    setText("");
    setImg(null);
  };

  return (
    <div className="inputContainer">
      <div className="input">
        <input
          type="text"
          placeholder="Write your message"
          onChange={(e) => setText(e.target.value)}
          value={text}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Evitar el comportamiento predeterminado del Enter
              handleSend(); // Llamar al método handleSend
            }
          }}
        />
        <div className="send">
          {/* <img src={Attach} alt="" /> */}
          <input
            type="file"
            style={{ display: "none" }}
            id="file"
            onChange={(e) => setImg(e.target.files[0])}
          />

          <label className="icon" htmlFor="file">
            <AttachFileIcon />
          </label>
          <div className="button" onClick={handleSend}>
            <div className="icon">
              <SendRoundedIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Input;
