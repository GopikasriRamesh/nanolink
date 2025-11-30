# core.py

# The set of characters we use (a-z, A-Z, 0-9) = 62 characters
BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode(num: int) -> str:
    """Converts a database ID (integer) into a short string."""
    if num == 0:
        return BASE62[0]
    
    arr = []
    base = len(BASE62)
    
    while num:
        # Modulo operator gives us the remainder (the 'digit')
        num, rem = divmod(num, base)
        arr.append(BASE62[rem])
        
    arr.reverse()
    return "".join(arr)

def decode(string: str) -> int:
    """Converts a short string back into a database ID."""
    base = len(BASE62)
    strlen = len(string)
    num = 0
    
    idx = 0
    for char in string:
        # Calculate power: base^(position)
        power = (strlen - (idx + 1))
        num += BASE62.index(char) * (base ** power)
        idx += 1
    return num

# --- Test it locally ---
if __name__ == "__main__":
    test_id = 123456789
    short_url = encode(test_id)
    print(f"ID: {test_id} -> Short: {short_url}")
    
    back_to_id = decode(short_url)
    print(f"Short: {short_url} -> ID: {back_to_id}")
    
    if test_id == back_to_id:
        print("✅ Algorithm works perfectly!")