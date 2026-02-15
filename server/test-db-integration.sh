#!/bin/bash

# EasyStay 数据库集成完整测试脚本
# 使用此脚本验证数据库迁移是否成功

set -e

baseURL="http://localhost:3000"
token=""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}EasyStay Database Integration Test${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# 测试 1: 测试 ping 接口
echo -e "${YELLOW}[1/9] Testing ping endpoint...${NC}"
response=$(curl -s -X GET "$baseURL/ping")
if [ "$response" = "pong" ]; then
  echo -e "${GREEN}✅ Ping test passed${NC}\n"
else
  echo -e "${RED}❌ Ping test failed${NC}"
  echo "Response: $response"
  exit 1
fi

# 测试 2: 注册商户用户
echo -e "${YELLOW}[2/9] Registering merchant user...${NC}"
response=$(curl -s -X POST "$baseURL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "merchant_test_'$(date +%s)'",
    "password": "test123456",
    "role": "merchant"
  }')
echo "Response: $response"

# 提取 username
username=$(echo "$response" | grep -o '"username":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$username" ]; then
  echo -e "${RED}❌ Registration failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Merchant registered: $username${NC}\n"

# 测试 3: 登录用户
echo -e "${YELLOW}[3/9] Testing login...${NC}"
response=$(curl -s -X POST "$baseURL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$username'",
    "password": "test123456"
  }')
echo "Response: $response"

# 提取 token
token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$token" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Login successful${NC}\n"
echo "Token: $token\n"

# 测试 4: 新增酒店
echo -e "${YELLOW}[4/9] Creating a new hotel...${NC}"
response=$(curl -s -X POST "$baseURL/api/hotels" \
  -H "Content-Type: application/json" \
  -H "Authorization: $token" \
  -d '{
    "name": "Test Hotel '$(date +%s)'",
    "city": "TestCity",
    "location": "Test Location",
    "pricePerNight": 299,
    "totalRooms": 100,
    "availableRooms": 50,
    "phoneNumber": "13800138000"
  }')
echo "Response: $response"

# 提取 hotelId
hotelId=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
if [ -z "$hotelId" ]; then
  echo -e "${RED}❌ Hotel creation failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Hotel created with ID: $hotelId${NC}\n"

# 测试 5: 获取酒店列表
echo -e "${YELLOW}[5/9] Fetching hotel list...${NC}"
response=$(curl -s -X GET "$baseURL/api/hotels?role=merchant&userId=1")
echo "Response: $response"

if echo "$response" | grep -q '"id"'; then
  echo -e "${GREEN}✅ Hotel list fetched successfully${NC}\n"
else
  echo -e "${RED}❌ Hotel list fetch failed${NC}"
  exit 1
fi

# 测试 6: 获取单个酒店详情
echo -e "${YELLOW}[6/9] Fetching hotel details...${NC}"
response=$(curl -s -X GET "$baseURL/api/hotels/$hotelId")
echo "Response: $response"

if echo "$response" | grep -q '"name"'; then
  echo -e "${GREEN}✅ Hotel details fetched successfully${NC}\n"
else
  echo -e "${RED}❌ Hotel details fetch failed${NC}"
  exit 1
fi

# 测试 7: 新增预订
echo -e "${YELLOW}[7/9] Creating a booking...${NC}"
checkInDate=$(date -d "+1 day" +%Y-%m-%d 2>/dev/null || date -v+1d +%Y-%m-%d)
checkOutDate=$(date -d "+3 days" +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d)

response=$(curl -s -X POST "$baseURL/api/bookings" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": '$hotelId',
    "guestName": "张三",
    "guestPhone": "13800000000",
    "guestEmail": "test@example.com",
    "checkInDate": "'$checkInDate'",
    "checkOutDate": "'$checkOutDate'",
    "numberOfRooms": 2,
    "totalPrice": 598
  }')
echo "Response: $response"

# 提取 bookingId
bookingId=$(echo "$response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
if [ -z "$bookingId" ]; then
  echo -e "${RED}❌ Booking creation failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Booking created with ID: $bookingId${NC}\n"

# 测试 8: 获取预订列表
echo -e "${YELLOW}[8/9] Fetching bookings...${NC}"
response=$(curl -s -X GET "$baseURL/api/bookings")
echo "Response: $response"

if echo "$response" | grep -q '"guestName"'; then
  echo -e "${GREEN}✅ Bookings fetched successfully${NC}\n"
else
  echo -e "${RED}❌ Bookings fetch failed${NC}"
  exit 1
fi

# 测试 9: 获取统计数据
echo -e "${YELLOW}[9/9] Fetching statistics...${NC}"
response=$(curl -s -X GET "$baseURL/api/statistics/revenue")
echo "Response: $response"

if echo "$response" | grep -q '"totalRevenue"'; then
  echo -e "${GREEN}✅ Statistics fetched successfully${NC}\n"
else
  echo -e "${RED}❌ Statistics fetch failed${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All tests passed! Database integration is successful!${NC}"
echo -e "${GREEN}========================================${NC}"
