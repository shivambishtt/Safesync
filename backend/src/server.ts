import app from "./app";

const PORT = process.env.PORT || 5000;
console.log(process.env.PORT, "port");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
