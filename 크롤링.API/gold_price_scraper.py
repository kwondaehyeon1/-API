import csv
import json
import urllib.request
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

# 한글 폰트 설정 (Windows 기본 맑은 고딕)
plt.rc('font', family='Malgun Gothic')
plt.rcParams['axes.unicode_minus'] = False

def get_gold_prices_1y():
    url = "https://koreagoldx.co.kr/api/price/chart/list"
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    payload = {
        "srchDt": "1Y",
        "type": "Au",
        "dataDateStart": start_date.strftime("%Y.%m.%d"),
        "dataDateEnd": end_date.strftime("%Y.%m.%d")
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url, 
        data=data, 
        headers={"Content-Type": "application/json; charset=utf-8"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read()
            res_json = json.loads(res_body)
            return res_json.get('list', [])
    except Exception as e:
        print(f"크롤링 중 에러가 발생했습니다: {e}")
        return []

if __name__ == "__main__":
    print("한국금거래소 1년치 금 시세 데이터를 가져오는 중...")
    prices = get_gold_prices_1y()
    
    print(f"총 {len(prices)}개의 금 시세 데이터를 성공적으로 가져왔습니다.")
    
    if prices:
        # 데이터 시간순 정렬 (과거 -> 현재)
        prices.sort(key=lambda x: x['date'])
        
        dates = []
        buy_prices = []
        sell_prices = []
        
        for p in prices:
            try:
                # 문자열을 datetime 객체로 변환하여 Matplotlib에서 날짜 축으로 인식하게 함
                dt = datetime.strptime(p.get('date', ''), '%Y-%m-%d %H:%M:%S')
                dates.append(dt)
                
                buy_prices.append(p.get('s_pure', 0))
                sell_prices.append(p.get('p_pure', 0))
            except Exception as e:
                pass
            
        print("그래프 컴파일 및 저장 중...")
        plt.figure(figsize=(12, 6))
        
        plt.plot(dates, buy_prices, label='내가 살 때 (순금 3.75g)', color='#008ffb', linewidth=2)
        plt.plot(dates, sell_prices, label='내가 팔 때 (순금 3.75g)', color='#ef892d', linewidth=2)
        
        plt.title('최근 1년 한국금거래소 금 시세 변동 추이', fontsize=16, fontweight='bold', pad=20)
        plt.xlabel('날짜', fontsize=12)
        plt.ylabel('가격 (원)', fontsize=12)
        
        # y축 금액 콤마 포맷팅 지정
        plt.gca().yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: format(int(x), ',')))
        
        plt.legend(fontsize=12)
        plt.grid(True, linestyle='--', alpha=0.6)
        plt.tight_layout()
        
        save_path = 'gold_price_chart.png'
        plt.savefig(save_path, dpi=300)
        print(f"\n성공적으로 그래프를 그려 [{save_path}] 파일로 저장했습니다!")
        
        # 4. CSV로 저장
        csv_path = 'gold_price_data.csv'
        try:
            with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
                writer = csv.writer(f)
                # 헤더 작성
                writer.writerow(['날짜', '내가 살 때(순금)', '내가 팔 때(순금)'])
                # 데이터 작성
                for i in range(len(dates)):
                    writer.writerow([dates[i].strftime('%Y-%m-%d %H:%M:%S'), buy_prices[i], sell_prices[i]])
            print(f"성공적으로 데이터를 [{csv_path}] 파일로 저장했습니다!")
        except Exception as e:
            print(f"CSV 저장 중 오류가 발생했습니다: {e}")
