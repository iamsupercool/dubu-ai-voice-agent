import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/ui/avatar';
import Image from 'next/image';

export default function Greeting() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage asChild src="/AI-Avatar.png">
          <Image src="/AI-Avatar.png" alt="AI" width={32} height={32} />
        </AvatarImage>
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-semibold text-foreground">만나서 반가워요!</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        메시지를 보내거나 마이크를 눌러서 대화를 시작해보세요
      </p>
    </div>
  );
}
