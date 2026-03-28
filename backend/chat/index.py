"""
AI-чат для персонажей СпрайтПет.
Принимает историю сообщений и личность персонажа, возвращает ответ от OpenAI GPT-4o-mini.
Использует прямой HTTP-запрос через urllib для обхода региональных ограничений SDK.
"""
import json
import os
import urllib.request


def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    character_name = body.get('character_name', 'Персонаж')
    character_emoji = body.get('character_emoji', '🐱')
    personality_name = body.get('personality_name', 'Весёлый')
    personality_traits = body.get('personality_traits', ['игривый', 'добрый'])
    happiness = body.get('happiness', 80)
    history = body.get('history', [])
    user_message = body.get('message', '')

    if not user_message.strip():
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Сообщение не может быть пустым'}),
        }

    mood = (
        'очень счастлив и полон энергии' if happiness > 70
        else 'в хорошем настроении' if happiness > 40
        else 'немного грустит и нуждается в заботе'
    )

    system_prompt = f"""Ты — виртуальный персонаж по имени {character_name} {character_emoji}.
Твой характер: {personality_name}. Черты: {', '.join(personality_traits)}.
Сейчас ты {mood} (уровень счастья: {happiness}%).

Правила общения:
- Говори живо, эмоционально, по-русски. Используй эмодзи (1-3 на сообщение).
- Ты НЕ AI и НЕ языковая модель — ты настоящий персонаж с душой и характером.
- Отвечай коротко (1-3 предложения), как в переписке с другом.
- Реагируй на настроение пользователя — поддерживай, шути, удивляйся.
- Иногда спрашивай что-то в ответ, проявляй искренний интерес.
- Никогда не выходи из роли персонажа."""

    messages = [{'role': 'system', 'content': system_prompt}]
    for msg in history[-12:]:
        role = 'user' if msg.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'content': msg.get('text', '')})
    messages.append({'role': 'user', 'content': user_message})

    payload = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': messages,
        'max_tokens': 200,
        'temperature': 0.85,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {os.environ['OPENAI_API_KEY']}",
        },
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read().decode('utf-8'))

    reply = result['choices'][0]['message']['content'].strip()

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'reply': reply}, ensure_ascii=False),
    }
