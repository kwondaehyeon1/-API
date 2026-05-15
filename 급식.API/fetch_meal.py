import urllib.request
import json
import datetime
import argparse
import re

def get_meal_info(date_str):
    print(f"자운고등학교 {date_str[:4]}년 {date_str[4:6]}월 {date_str[6:]}일 급식 메뉴를 조회합니다...\n")
    
    # 자운고등학교 코드
    ATPT_OFCDC_SC_CODE = 'B10'  # 서울특별시교육청
    SD_SCHUL_CODE = '7010703'      # 자운고등학교
    
    # 나이스 교육정보 개방포털 급식 API
    url = f"https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE={ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE={SD_SCHUL_CODE}&MLSV_YMD={date_str}"
    
    try:
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req)
        
        if response.getcode() == 200:
            data = json.loads(response.read().decode('utf-8'))
            
            if 'mealServiceDietInfo' in data:
                meal_info = data['mealServiceDietInfo'][1]['row'][0]
                diet = meal_info['DDISH_NM']
                calories = meal_info['CAL_INFO']
                
                # HTML 태그 제거 및 정리
                # <br/> 을 줄바꿈으로 변경
                diet = diet.replace('<br/>', '\n')
                
                # 출력 포맷 맞추기
                print("================================")
                print("        🍱 오늘 뭐 먹지?        ")
                print("       [ 자운고등학교 급식 ]    ")
                print("================================")
                print(diet)
                print("--------------------------------")
                print(f"🔥 칼로리: {calories}")
                print("================================\n")
            else:
                print("================================")
                print(" [안내] 해당 날짜의 급식 정보가 없습니다.")
                if 'RESULT' in data and 'MESSAGE' in data['RESULT']:
                    print(f" 사유: {data['RESULT']['MESSAGE']}")
                print("================================\n")
        else:
            print(f"API 요청 실패 (상태 코드: {response.getcode()})")
            
    except Exception as e:
        print(f"프로그램 실행 중 오류가 발생했습니다: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='자운고등학교 급식조회 프로그램')
    parser.add_argument('-d', '--date', type=str, help='조회할 날짜 (YYYYMMDD 형식, 예: 20260515). 입력하지 않으면 오늘 날짜로 조회합니다.', default=None)
    
    args = parser.parse_args()
    
    if args.date:
        target_date = args.date
    else:
        # 입력된 날짜가 없으면 오늘 날짜 사용
        target_date = datetime.datetime.now().strftime('%Y%m%d')
        
    get_meal_info(target_date)
