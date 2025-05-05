import { useState } from "react";
import { collection, writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function AddProductPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const productsData = [
    {
      category: "전자기기",
      name: "스마트 LED TV",
      description:
        "4K 해상도의 선명한 화질과 스마트 기능을 갖춘 LED TV입니다. 넷플릭스, 유튜브 등 다양한 앱을 지원합니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://plus.unsplash.com/premium_photo-1681236323432-3df82be0c1b0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://plus.unsplash.com/premium_photo-1682098177867-dfd0f0402428?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dHZ8ZW58MHx8MHx8fDA%3D",
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dHZ8ZW58MHx8MHx8fDA%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 15,
      stock: 50,
      price: 499000,
    },
    {
      category: "전자기기",
      name: "무선 블루투스 이어폰",
      description: "노이즈 캔슬링 기능이 탑재된 프리미엄 무선 이어폰입니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://images.unsplash.com/photo-1505236273191-1dce886b01e9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Ymx1ZXRvb3RoJTIwZWFycGhvbmV8ZW58MHx8MHx8fDA%3D",
        "https://images.unsplash.com/photo-1691256291309-a4682ed0e4fe?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fGJsdWV0b290aCUyMGVhcnBob25lfGVufDB8fDB8fHww",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 20,
      stock: 120,
      price: 189000,
    },
    {
      category: "전자기기",
      name: "스마트워치 프로",
      description:
        "심박수, 혈압, 산소포화도 측정 기능이 있는 스마트워치입니다. 2일 연속 사용 가능한 긴 배터리 수명을 자랑합니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c21hcnQlMjB3YXRjaHxlbnwwfHwwfHx8MA%3D%3D",
        "https://plus.unsplash.com/premium_photo-1712764121254-d9867c694b81?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c21hcnQlMjB3YXRjaHxlbnwwfHwwfHx8MA%3D%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 10,
      stock: 75,
      price: 279000,
    },
    {
      category: "도서",
      name: "리액트와 타입스크립트 마스터",
      description:
        "프론트엔드 개발자를 위한 리액트와 타입스크립트 완벽 가이드입니다. 실전 예제와 함께 배워보세요.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGJvb2t8ZW58MHx8MHx8fDA%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 5,
      stock: 200,
      price: 35000,
    },
    {
      category: "도서",
      name: "알고리즘 문제집",
      description:
        "개발자 취업 준비를 위한 코딩테스트 대비 알고리즘 문제집입니다. 난이도별 300문제와 해설이 포함되어 있습니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://plus.unsplash.com/premium_photo-1669652639337-c513cc42ead6?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Ym9va3xlbnwwfHwwfHx8MA%3D%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 20,
      stock: 150,
      price: 28000,
    },
    {
      category: "의류",
      name: "겨울용 패딩 점퍼",
      description:
        "초경량 다운 충전재를 사용한 따뜻한 패딩 점퍼입니다. 방수 기능이 있어 눈이나 비에도 적합합니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://plus.unsplash.com/premium_photo-1737453322908-e1b7ec1b2096?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODl8fHdpbnRlciUyMG91dGRvb3J8ZW58MHx8MHx8fDA%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 30,
      stock: 60,
      price: 159000,
    },
    {
      category: "의류",
      name: "캐주얼 데님 청바지",
      description:
        "편안한 착용감의 스트레치 데님 소재로 제작된 청바지입니다. 다양한 상의와 코디하기 좋은 기본 아이템입니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://plus.unsplash.com/premium_photo-1674828601362-afb73c907ebe?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8amVhbnxlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1714143136367-7bb68f3f0669?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fGplYW58ZW58MHx8MHx8fDA%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 15,
      stock: 100,
      price: 59000,
    },
    {
      category: "가구",
      name: "모던 패브릭 소파",
      description:
        "심플하고 모던한 디자인의 패브릭 소파입니다. 부드러운 촉감과 견고한 프레임으로 내구성이 뛰어납니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://plus.unsplash.com/premium_photo-1661765778256-169bf5e561a6?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c29mYXxlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c29mYXxlbnwwfHwwfHx8MA%3D%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 20,
      stock: 15,
      price: 699000,
    },
    {
      category: "가구",
      name: "원목 책상 세트",
      description:
        "천연 원목으로 제작된 책상과 의자 세트입니다. 튼튼한 구조와 고급스러운 마감처리가 특징입니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://plus.unsplash.com/premium_photo-1711051475117-f3a4d3ff6778?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8ZGVza3xlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGRlc2t8ZW58MHx8MHx8fDA%3D",
        "https://images.unsplash.com/photo-1519219788971-8d9797e0928e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZGVza3xlbnwwfHwwfHx8MA%3D%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 10,
      stock: 20,
      price: 450000,
    },
    {
      category: "음식",
      name: "프리미엄 과일 선물세트",
      description:
        "제철 과일로 구성된 고급 선물세트입니다. 사과, 배, 샤인머스켓 등 엄선된 국내산 과일들로 구성되어 있습니다.",
      numReviews: 0,
      rating: 0,
      images: [
        "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGZydWl0c3xlbnwwfHwwfHx8MA%3D%3D",
        "https://images.unsplash.com/photo-1519996529931-28324d5a630e?q=80&w=3987&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      discountPercentage: 5,
      stock: 30,
      price: 89000,
    },
  ];

  // Firestore에 batch로 데이터 추가하는 함수
  const addProductsToFirestore = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      const productsRef = collection(db, "products");

      productsData.forEach((product) => {
        // 새 문서 ID 생성
        const newDocRef = doc(productsRef);
        batch.set(newDocRef, product);
      });

      // 배치 커밋
      await batch.commit();
      console.log("모든 제품이 성공적으로 추가되었습니다!");
      setIsSuccess(true);
    } catch (error: any) {
      console.error("제품 추가 중 오류 발생:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center py-12">
        <button onClick={addProductsToFirestore} disabled={isLoading}>
          {isLoading ? (
            <LoadingSpinner size="large" />
          ) : (
            <p className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition">
              Product Data 추가하기
            </p>
          )}
        </button>

        {isSuccess && (
          <p className="mt-4 text-green-500 dark:text-green-400">
            모든 제품이 성공적으로 추가되었습니다!
          </p>
        )}
        {error && (
          <p className="mt-4 text-red-500 dark:text-red-400">
            오류 발생:{error}
          </p>
        )}
      </div>
    </div>
  );
}

export default AddProductPage;
