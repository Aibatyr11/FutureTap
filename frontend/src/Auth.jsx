import { useState } from "react";
import API from "./api";

export default function Auth() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [isLogin, setIsLogin] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? "login/" : "register/";
      const res = await API.post(endpoint, form);
      setMessage(res.data.message || "Успешно!");
    } catch (err) {
      setMessage("Ошибка: " + (err.response?.data?.error || "Что-то пошло не так"));
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h2>{isLogin ? "Вход" : "Регистрация"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Имя пользователя"
          value={form.username}
          onChange={handleChange}
        />
        {!isLogin && (
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
        )}
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={form.password}
          onChange={handleChange}
        />
        <button type="submit">{isLogin ? "Войти" : "Зарегистрироваться"}</button>
      </form>

      <p>{message}</p>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Создать аккаунт" : "У меня уже есть аккаунт"}
      </button>
    </div>
  );
}
