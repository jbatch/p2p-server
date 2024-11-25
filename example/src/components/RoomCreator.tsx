// example/src/components/RoomCreator.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  gameType: z.string().min(1),
  maxPlayers: z.number().min(2).max(10),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onCreateRoom: (gameType: string, maxPlayers: number) => void;
}

export const RoomCreator: React.FC<Props> = ({ onCreateRoom }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gameType: "demo-game",
      maxPlayers: 2,
    },
  });

  const onSubmit = (data: FormData) => {
    onCreateRoom(data.gameType, data.maxPlayers);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-bold mb-4">Create Room</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Game Type
            <input
              {...register("gameType")}
              className="mt-1 w-full p-2 border rounded"
            />
          </label>
          {errors.gameType && (
            <span className="text-red-500 text-sm">
              {errors.gameType.message}
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Max Players
            <input
              type="number"
              {...register("maxPlayers", { valueAsNumber: true })}
              className="mt-1 w-full p-2 border rounded"
            />
          </label>
          {errors.maxPlayers && (
            <span className="text-red-500 text-sm">
              {errors.maxPlayers.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Create Room
        </button>
      </form>
    </div>
  );
};
