from ping3 import ping

url = "https://urs.dfghjk.blog/profile/affiliate"
response_time = ping(url)

if response_time is None:
    print(f"Não foi possível alcançar {url}.")
else:
    print(f"Ping para {url}: {response_time * 1000:.2f} ms")
