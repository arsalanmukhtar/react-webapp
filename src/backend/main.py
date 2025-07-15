from fastapi import FastAPI

app = FastAPI()

@app.get("/api/hello")
async def say_hello():
    return {"message": "Hello, Python!"}