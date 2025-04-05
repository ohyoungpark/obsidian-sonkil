# Sonkil - Emacs-style Text Operations for Obsidian

Sonkil은 Obsidian에서 이맥스 스타일의 텍스트 조작 기능을 제공하는 플러그인입니다. 이맥스의 강력한 텍스트 조작 기능을 Obsidian에서도 사용할 수 있게 해줍니다.

## 주요 기능

### 텍스트 조작
- `C-k`: 현재 커서 위치부터 줄 끝까지 텍스트를 잘라내기 (Kill Line)
- `C-w`: 선택된 영역을 잘라내기 (Kill Region)
- `M-w`: 선택된 영역을 복사하기 (Copy Region)

### Kill Ring
- `C-y`: Kill ring에서 가장 최근 텍스트 붙여넣기 (Yank)
- `M-y`: Yank 직후에 사용하면 이전에 잘라낸 텍스트로 순환 (Yank Pop)
- Kill ring에 저장된 최대 항목 수: 60개
- Kill ring 항목의 최대 길이: 10,000자

### 클립보드 통합
- Kill ring이 비어있을 때 `C-y`를 사용하면 시스템 클립보드의 내용을 붙여넣기
- 잘라내기/복사한 텍스트는 시스템 클립보드에도 자동으로 복사

### 편의 기능
- Kill ring 항목이 10,000자를 초과하면 자동으로 잘라내기
- Kill ring이 가득 차면 가장 오래된 항목부터 자동으로 제거
- 텍스트 조작 시 자동으로 선택 영역 해제

## 설치 방법

### 일반 사용자
1. Obsidian 설정에서 "커뮤니티 플러그인" 활성화
2. "안전 모드" 비활성화
3. "Sonkil" 플러그인 설치 및 활성화

### 개발자용

#### 요구사항
- Node.js 18 이상
- npm 10 이상
- Obsidian 데스크톱 앱

#### 개발 환경 설정

1. 프로젝트 클론:
```bash
git clone https://github.com/ohyoungpark/obsidian-sonkil
cd obsidian-sonkil
```

2. Node.js 버전 설정 (nvm 사용):
```bash
nvm use
```

3. 의존성 설치:
```bash
npm install
```

4. 개발 환경 설정:
```bash
# .env 파일 생성
echo "OBSIDIAN_PLUGIN_DIR=/path/to/your/obsidian/plugins/obsidian-sonkil" > .env

# .env 파일의 OBSIDIAN_PLUGIN_DIR 값을 자신의 Obsidian 플러그인 디렉토리 경로로 수정
```

5. 빌드 및 테스트:
```bash
# 빌드
npm run build

# 테스트 실행
npm test

# 개발 모드 설치 (로컬 Obsidian vault에 설치)
npm run install-dev
```

> **참고**:
> - `.env` 파일은 Git에 커밋되지 않도록 `.gitignore`에 추가되어 있습니다.
> - 개발 모드 설치 후에는 Obsidian을 재시작해야 변경사항이 적용됩니다.

## 테스트 커버리지

현재 테스트 커버리지:
- Statements: 67.24%
- Branches: 58.97%
- Functions: 57.89%
- Lines: 67.54%

## 기여하기

1. 이슈 생성: 버그 리포트나 기능 제안
2. Pull Request: 코드 기여
3. 문서 개선: README나 주석 개선

## 라이선스

MIT License

## 개발자 정보

- 개발자: 박오영
- 이메일: ohyoung.park@mail.com
- GitHub: https://github.com/ohyoungpark/obsidian-sonkil